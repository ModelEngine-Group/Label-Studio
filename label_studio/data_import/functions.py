import logging
import time
import traceback
from typing import Callable, Optional

from core.feature_flags import flag_set
from core.utils.common import load_func
from django.conf import settings
from django.db import transaction
from projects.models import ProjectImport, ProjectReimport, ProjectSummary
from tasks.models import Task
from users.models import User
from webhooks.models import WebhookAction
from webhooks.utils import emit_webhooks_for_instance

from .models import FileUpload
from .serializers import ImportApiSerializer
from .uploader import load_tasks_for_async_import

logger = logging.getLogger(__name__)


def async_import_background(
    import_id, user_id, recalculate_stats_func: Optional[Callable[..., None]] = None, **kwargs
):
    with transaction.atomic():
        try:
            project_import = ProjectImport.objects.get(id=import_id)
        except ProjectImport.DoesNotExist:
            logger.error(f'ProjectImport with id {import_id} not found, import processing failed')
            return
        if project_import.status != ProjectImport.Status.CREATED:
            logger.error(f'Processing import with id {import_id} already started')
            return
        project_import.status = ProjectImport.Status.IN_PROGRESS
        project_import.save(update_fields=['status'])

    user = User.objects.get(id=user_id)

    start = time.time()
    project = project_import.project
    tasks = None
    # upload files from request, and parse all tasks
    # TODO: Stop passing request to load_tasks function, make all validation before
    tasks, file_upload_ids, found_formats, data_columns = load_tasks_for_async_import(project_import, user)

    if project_import.preannotated_from_fields:
        # turn flat task JSONs {"column1": value, "column2": value} into {"data": {"column1"..}, "predictions": [{..."column2"}]
        tasks = reformat_predictions(tasks, project_import.preannotated_from_fields)

    if project_import.commit_to_project:
        with transaction.atomic():
            # Lock summary for update to avoid race conditions
            summary = ProjectSummary.objects.select_for_update().get(project=project)

            # Immediately create project tasks and update project states and counters
            serializer = ImportApiSerializer(data=tasks, many=True, context={'project': project})
            serializer.is_valid(raise_exception=True)
            tasks = serializer.save(project_id=project.id)
            emit_webhooks_for_instance(user.active_organization, project, WebhookAction.TASKS_CREATED, tasks)

            task_count = len(tasks)
            annotation_count = len(serializer.db_annotations)
            prediction_count = len(serializer.db_predictions)
            # Update counters (like total_annotations) for new tasks and after bulk update tasks stats. It should be a
            # single operation as counters affect bulk is_labeled update

            recalculate_stats_counts = {
                'task_count': task_count,
                'annotation_count': annotation_count,
                'prediction_count': prediction_count,
            }

            project.update_tasks_counters_and_task_states(
                tasks_queryset=tasks,
                maximum_annotations_changed=False,
                overlap_cohort_percentage_changed=False,
                tasks_number_changed=True,
                recalculate_stats_counts=recalculate_stats_counts,
            )
            logger.info('Tasks bulk_update finished (async import)')

            summary.update_data_columns(tasks)
            # TODO: summary.update_created_annotations_and_labels
    else:
        # Do nothing - just output file upload ids for further use
        task_count = len(tasks)
        annotation_count = None
        prediction_count = None

    duration = time.time() - start

    project_import.task_count = task_count or 0
    project_import.annotation_count = annotation_count or 0
    project_import.prediction_count = prediction_count or 0
    project_import.duration = duration
    project_import.file_upload_ids = file_upload_ids
    project_import.found_formats = found_formats
    project_import.data_columns = data_columns
    if project_import.return_task_ids:
        project_import.task_ids = [task.id for task in tasks]

    project_import.status = ProjectImport.Status.COMPLETED
    project_import.save()


def set_import_background_failure(job, connection, type, value, _):
    import_id = job.args[0]
    ProjectImport.objects.filter(id=import_id).update(
        status=ProjectImport.Status.FAILED, traceback=traceback.format_exc(), error=str(value)
    )


def set_reimport_background_failure(job, connection, type, value, _):
    reimport_id = job.args[0]
    ProjectReimport.objects.filter(id=reimport_id).update(
        status=ProjectReimport.Status.FAILED,
        traceback=traceback.format_exc(),
        error=str(value),
    )


def reformat_predictions(tasks, preannotated_from_fields):
    new_tasks = []
    for task in tasks:
        if 'data' in task:
            task = task['data']
        predictions = [{'result': task.pop(field)} for field in preannotated_from_fields]
        new_tasks.append({'data': task, 'predictions': predictions})
    return new_tasks


post_process_reimport = load_func(settings.POST_PROCESS_REIMPORT)


def _async_reimport_background_streaming(reimport, project, organization_id, user):
    """Streaming version of reimport that processes tasks in batches to reduce memory usage"""
    try:
        # Get batch size from settings or use default
        batch_size = settings.REIMPORT_BATCH_SIZE

        # Initialize counters
        total_task_count = 0
        total_annotation_count = 0
        total_prediction_count = 0
        all_found_formats = {}
        all_data_columns = set()
        all_created_task_ids = []

        # Remove old tasks once before starting
        with transaction.atomic():
            project.remove_tasks_by_file_uploads(reimport.file_upload_ids)

        # Process tasks in batches
        batch_number = 0
        for batch_tasks, batch_formats, batch_columns in FileUpload.load_tasks_from_uploaded_files_streaming(
            project, reimport.file_upload_ids, files_as_tasks_list=reimport.files_as_tasks_list, batch_size=batch_size
        ):
            if not batch_tasks:
                logger.info(f'Empty batch received for reimport {reimport.id}')
                continue

            batch_number += 1
            logger.info(f'Processing batch {batch_number} with {len(batch_tasks)} tasks for reimport {reimport.id}')

            # Process batch in transaction
            with transaction.atomic():
                # Lock summary for update to avoid race conditions
                summary = ProjectSummary.objects.select_for_update().get(project=project)

                # Serialize and save batch
                serializer = ImportApiSerializer(
                    data=batch_tasks, many=True, context={'project': project, 'user': user}
                )
                serializer.is_valid(raise_exception=True)
                batch_db_tasks = serializer.save(project_id=project.id)

                # Collect task IDs for later use
                all_created_task_ids.extend([t.id for t in batch_db_tasks])

                # Update batch counters
                batch_task_count = len(batch_db_tasks)
                batch_annotation_count = len(serializer.db_annotations)
                batch_prediction_count = len(serializer.db_predictions)

                total_task_count += batch_task_count
                total_annotation_count += batch_annotation_count
                total_prediction_count += batch_prediction_count

                # Update formats and columns
                all_found_formats.update(batch_formats)
                if batch_columns:
                    if not all_data_columns:
                        all_data_columns = batch_columns
                    else:
                        all_data_columns &= batch_columns

                # Update data columns in summary
                summary.update_data_columns(batch_db_tasks)

            logger.info(
                f'Batch {batch_number} processed successfully: {batch_task_count} tasks, '
                f'{batch_annotation_count} annotations, {batch_prediction_count} predictions'
            )

        # After all batches are processed, emit webhooks and update task states once
        if all_created_task_ids:
            logger.info(
                f'Finalizing reimport: emitting webhooks and updating task states for {len(all_created_task_ids)} tasks'
            )

            # Emit webhooks for all tasks at once (passing list of IDs)
            emit_webhooks_for_instance(organization_id, project, WebhookAction.TASKS_CREATED, all_created_task_ids)

            # Update task states for all tasks at once
            all_tasks_queryset = Task.objects.filter(id__in=all_created_task_ids)
            recalculate_stats_counts = {
                'task_count': total_task_count,
                'annotation_count': total_annotation_count,
                'prediction_count': total_prediction_count,
            }

            project.update_tasks_counters_and_task_states(
                tasks_queryset=all_tasks_queryset,
                maximum_annotations_changed=False,
                overlap_cohort_percentage_changed=False,
                tasks_number_changed=True,
                recalculate_stats_counts=recalculate_stats_counts,
            )
            logger.info('Tasks bulk_update finished (async streaming reimport)')

        # Update reimport with final statistics
        reimport.task_count = total_task_count
        reimport.annotation_count = total_annotation_count
        reimport.prediction_count = total_prediction_count
        reimport.found_formats = all_found_formats
        reimport.data_columns = list(all_data_columns)
        reimport.status = ProjectReimport.Status.COMPLETED
        reimport.save()

        logger.info(f'Streaming reimport {reimport.id} completed: {total_task_count} tasks imported')

        # Run post-processing
        post_process_reimport(reimport)

    except Exception as e:
        logger.error(f'Error in streaming reimport {reimport.id}: {str(e)}', exc_info=True)
        reimport.status = ProjectReimport.Status.FAILED
        reimport.traceback = traceback.format_exc()
        reimport.error = str(e)
        reimport.save()
        raise


def async_reimport_background(reimport_id, organization_id, user, **kwargs):

    with transaction.atomic():
        try:
            reimport = ProjectReimport.objects.get(id=reimport_id)
        except ProjectReimport.DoesNotExist:
            logger.error(f'ProjectReimport with id {reimport_id} not found, import processing failed')
            return
        if reimport.status != ProjectReimport.Status.CREATED:
            logger.error(f'Processing reimport with id {reimport_id} already started')
            return
        reimport.status = ProjectReimport.Status.IN_PROGRESS
        reimport.save(update_fields=['status'])

    project = reimport.project

    # Check feature flag for memory improvement
    if flag_set('fflag_fix_back_plt_838_reimport_memory_improvement_05082025_short', user='auto'):
        logger.info(f'Using streaming reimport for project {project.id}')
        _async_reimport_background_streaming(reimport, project, organization_id, user)
    else:
        # Original implementation
        tasks, found_formats, data_columns = FileUpload.load_tasks_from_uploaded_files(
            reimport.project, reimport.file_upload_ids, files_as_tasks_list=reimport.files_as_tasks_list
        )

        with transaction.atomic():
            # Lock summary for update to avoid race conditions
            summary = ProjectSummary.objects.select_for_update().get(project=project)

            project.remove_tasks_by_file_uploads(reimport.file_upload_ids)
            serializer = ImportApiSerializer(data=tasks, many=True, context={'project': project, 'user': user})
            serializer.is_valid(raise_exception=True)
            tasks = serializer.save(project_id=project.id)
            emit_webhooks_for_instance(organization_id, project, WebhookAction.TASKS_CREATED, tasks)

            task_count = len(tasks)
            annotation_count = len(serializer.db_annotations)
            prediction_count = len(serializer.db_predictions)

            recalculate_stats_counts = {
                'task_count': task_count,
                'annotation_count': annotation_count,
                'prediction_count': prediction_count,
            }

            # Update counters (like total_annotations) for new tasks and after bulk update tasks stats. It should be a
            # single operation as counters affect bulk is_labeled update
            project.update_tasks_counters_and_task_states(
                tasks_queryset=tasks,
                maximum_annotations_changed=False,
                overlap_cohort_percentage_changed=False,
                tasks_number_changed=True,
                recalculate_stats_counts=recalculate_stats_counts,
            )
            logger.info('Tasks bulk_update finished (async reimport)')

            summary.update_data_columns(tasks)
            # TODO: summary.update_created_annotations_and_labels

        reimport.task_count = task_count
        reimport.annotation_count = annotation_count
        reimport.prediction_count = prediction_count
        reimport.found_formats = found_formats
        reimport.data_columns = list(data_columns)
        reimport.status = ProjectReimport.Status.COMPLETED
        reimport.save()

        post_process_reimport(reimport)
