import pytest
from organizations.tests.factories import OrganizationFactory
from rest_framework import status
from rest_framework.test import APIClient
from session_policy.models import SessionTimeoutPolicy

from label_studio.tests.conftest import fflag_feat_utc_46_session_timeout_policy_on  # noqa: F401


@pytest.mark.django_db
def test_session_timeout_policy(fflag_feat_utc_46_session_timeout_policy_on):
    organization = OrganizationFactory()

    client = APIClient()
    user = organization.created_by
    user.set_password('testpass123')
    user.save()

    # Login to create a session
    response = client.post('/user/login/', {'email': user.email, 'password': 'testpass123'})
    assert response.status_code == status.HTTP_302_FOUND

    # First API call should succeed
    response = client.get('/api/projects/')
    assert response.status_code == status.HTTP_200_OK

    # Get the session timeout policy and set it to 0 hours
    # Object already exists after the first request since its an AutoOneToOneField
    timeout_policy = SessionTimeoutPolicy.objects.get(organization=organization)
    timeout_policy.max_session_age = 0
    timeout_policy.max_time_between_activity = 0
    timeout_policy.save()

    # Next API call should fail due to session timeout
    response = client.get('/api/projects/')
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
