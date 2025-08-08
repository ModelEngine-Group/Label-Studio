"""Test streaming import functionality for memory optimization"""
from unittest.mock import MagicMock, patch

import pytest
from data_import.models import FileUpload
from organizations.tests.factories import OrganizationFactory
from projects.tests.factories import ProjectFactory
from users.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestStreamingImport:
    @pytest.fixture
    def user(self):
        return UserFactory()

    @pytest.fixture
    def organization(self):
        return OrganizationFactory()

    @pytest.fixture
    def project(self, user, organization):
        return ProjectFactory(
            created_by=user,
            organization=organization,
            label_config='<View><Text name="text" value="$text"/><Choices name="label" toName="text"><Choice value="pos"/><Choice value="neg"/></Choices></View>',
        )

    def test_load_tasks_from_uploaded_files_streaming_basic(self, user, project):
        """Test basic streaming functionality with small batches"""
        # Mock file upload objects
        with patch.object(FileUpload.objects, 'filter') as mock_filter:
            mock_file_upload1 = MagicMock()
            mock_file_upload1.format = '.json'
            mock_file_upload1.id = 1
            mock_file_upload1.read_tasks.return_value = [{'data': {'text': f'Task {i}'}} for i in range(10)]

            mock_file_upload2 = MagicMock()
            mock_file_upload2.format = '.json'
            mock_file_upload2.id = 2
            mock_file_upload2.read_tasks.return_value = [{'data': {'text': f'Task {i+10}'}} for i in range(10)]

            mock_filter.return_value = [mock_file_upload1, mock_file_upload2]

            # Test streaming with batch size 5
            batches = list(FileUpload.load_tasks_from_uploaded_files_streaming(project, batch_size=5))

            # Should have 4 batches (20 tasks / 5 per batch)
            assert len(batches) == 4

            # Check batch sizes
            assert len(batches[0][0]) == 5  # First batch tasks
            assert len(batches[1][0]) == 5  # Second batch tasks
            assert len(batches[2][0]) == 5  # Third batch tasks
            assert len(batches[3][0]) == 5  # Fourth batch tasks

            # Check that all tasks have file_upload_id
            for batch_tasks, _, _ in batches:
                for task in batch_tasks:
                    assert 'file_upload_id' in task

    def test_load_tasks_from_uploaded_files_streaming_empty(self, project):
        """Test streaming with no file uploads"""
        # Mock empty file uploads
        with patch.object(FileUpload.objects, 'filter') as mock_filter:
            mock_filter.return_value = []

            batches = list(FileUpload.load_tasks_from_uploaded_files_streaming(project, batch_size=5))

            # Should have one empty batch with metadata
            assert len(batches) == 1
            assert len(batches[0][0]) == 0  # Empty tasks
            assert batches[0][1] == {}  # Empty formats
            assert batches[0][2] == set()  # Empty columns
