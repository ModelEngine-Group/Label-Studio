import factory
from core.utils.common import load_func
from django.conf import settings
from faker import Faker
from tasks.models import Annotation, Task


class TaskFactory(factory.django.DjangoModelFactory):
    data = factory.LazyFunction(
        lambda: {
            'text': Faker().sentence(),
        }
    )
    project = factory.SubFactory(load_func(settings.PROJECT_FACTORY))

    class Meta:
        model = Task


class AnnotationFactory(factory.django.DjangoModelFactory):
    task = factory.SubFactory(TaskFactory)
    project = factory.SelfAttribute('task.project')
    completed_by = factory.SubFactory(load_func(settings.USER_FACTORY))

    class Meta:
        model = Annotation
