import json

import boto3
import pytest
from django.test import TestCase
from io_storages.models import S3ImportStorage
from io_storages.s3.models import S3ImportStorageLink
from io_storages.tests.factories import (
    AzureBlobImportStorageFactory,
    GCSImportStorageFactory,
    RedisImportStorageFactory,
    S3ImportStorageFactory,
)
from moto import mock_s3
from projects.tests.factories import ProjectFactory
from rest_framework.test import APIClient
from tests.utils import azure_client_mock, gcs_client_mock, mock_feature_flag, redis_client_mock


@pytest.mark.skip(reason='FF mocking is broken here, letting these tests run in LSE instead')
class TestMultiTaskImport(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Setup project with simple config
        cls.project = ProjectFactory()

        # Common test data
        cls.common_task_data = [
            {'data': {'image_url': 'http://ggg.com/image.jpg', 'text': 'Task 1 text'}},
            {'data': {'image_url': 'http://ggg.com/image2.jpg', 'text': 'Task 2 text'}},
        ]

    @mock_feature_flag('fflag_feat_dia_2092_multitasks_per_storage_link', True)
    def _test_storage_import(self, storage_class, task_data, **storage_kwargs):
        """Helper to test import for a specific storage type"""

        # can't do this in the classmethod for some reason, or self.client != cls.client
        client = APIClient()
        client.force_authenticate(user=self.project.created_by)

        # Setup storage with required credentials
        storage = storage_class(project=self.project, **storage_kwargs)

        # Validate connection before sync
        try:
            storage.validate_connection()
        except Exception as e:
            self.fail(f'Storage connection validation failed: {str(e)}')

        # Sync storage
        # Don't have to wait for sync to complete because it's blocking without rq
        storage.sync()

        # Validate tasks were imported correctly
        tasks_response = client.get(f'/api/tasks?project={self.project.id}')
        self.assertEqual(tasks_response.status_code, 200)
        tasks = tasks_response.json()['tasks']
        self.assertEqual(len(tasks), len(task_data))

        # Validate task content
        for task, expected_data in zip(tasks, task_data):
            self.assertEqual(task['data'], expected_data['data'])

    def test_import_multiple_tasks_s3(self):
        with mock_s3():
            # Setup S3 bucket and test data
            s3 = boto3.client('s3', region_name='us-east-1')
            bucket_name = 'pytest-s3-jsons'
            s3.create_bucket(Bucket=bucket_name)

            # Put test data into S3
            s3.put_object(Bucket=bucket_name, Key='test.json', Body=json.dumps(self.common_task_data))

            self._test_storage_import(
                S3ImportStorageFactory,
                self.common_task_data,
                bucket='pytest-s3-jsons',
                aws_access_key_id='example',
                aws_secret_access_key='example',
                use_blob_urls=False,
            )

    def test_import_multiple_tasks_gcs(self):
        # initialize mock with sample data
        with gcs_client_mock():

            self._test_storage_import(
                GCSImportStorageFactory,
                self.common_task_data,
                # magic bucket name to set correct data in gcs_client_mock
                bucket='multitask_JSON',
                use_blob_urls=False,
            )

    def test_import_multiple_tasks_azure(self):
        # initialize mock with sample data
        with azure_client_mock(sample_json_contents=self.common_task_data, sample_blob_names=['test.json']):

            self._test_storage_import(
                AzureBlobImportStorageFactory,
                self.common_task_data,
                use_blob_urls=False,
            )

    def test_import_multiple_tasks_redis(self):
        with redis_client_mock() as redis:

            redis.set('test.json', json.dumps(self.common_task_data))

            self._test_storage_import(
                RedisImportStorageFactory,
                self.common_task_data,
                path='',
                use_blob_urls=False,
            )

    def test_storagelink_fields(self):
        # use an actual storage and storagelink to test this, since factories aren't connected properly
        with mock_s3():
            # Setup S3 bucket and test data
            s3 = boto3.client('s3', region_name='us-east-1')
            bucket_name = 'pytest-s3-jsons'
            s3.create_bucket(Bucket=bucket_name)

            # Put test data into S3
            s3.put_object(Bucket=bucket_name, Key='test.json', Body=json.dumps(self.common_task_data))

            # create a real storage and sync it
            storage = S3ImportStorage(
                project=self.project,
                bucket=bucket_name,
                aws_access_key_id='example',
                aws_secret_access_key='example',
                use_blob_urls=False,
            )
            storage.save()
            storage.sync()

            # check that the storage link fields are set correctly
            storage_links = S3ImportStorageLink.objects.filter(storage=storage).order_by('task_id')
            self.assertEqual(storage_links[0].row_index, 0)
            self.assertEqual(storage_links[0].row_group, None)
            self.assertEqual(storage_links[1].row_index, 1)
            self.assertEqual(storage_links[1].row_group, None)
