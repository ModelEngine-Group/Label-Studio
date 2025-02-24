import pytest
from jwt_auth.models import LSAPIToken
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.exceptions import TokenError
from tests.jwt_auth.utils import create_user_with_token_settings
from tests.utils import mock_feature_flag


@mock_feature_flag(flag_name='fflag__feature_develop__prompts__dia_1829_jwt_token_auth', value=True)
@pytest.mark.django_db
def test_blacklist_view_returns_404_with_already_blacklisted_token(client):
    user = create_user_with_token_settings(api_tokens_enabled=True, legacy_api_tokens_enabled=False)
    client.force_login(user)

    token = LSAPIToken()
    token.blacklist()
    response = client.post('/api/token/blacklist/', data={'refresh': token.get_full_jwt()})

    assert response.status_code == status.HTTP_404_NOT_FOUND


@mock_feature_flag(flag_name='fflag__feature_develop__prompts__dia_1829_jwt_token_auth', value=True)
@pytest.mark.django_db
def test_blacklist_view_returns_204_with_valid_token(client):
    user = create_user_with_token_settings(api_tokens_enabled=True, legacy_api_tokens_enabled=False)
    client.force_login(user)

    token = LSAPIToken()
    response = client.post('/api/token/blacklist/', data={'refresh': token.get_full_jwt()})

    assert response.status_code == status.HTTP_204_NO_CONTENT
    with pytest.raises(TokenError):
        token.check_blacklist()


@mock_feature_flag(flag_name='fflag__feature_develop__prompts__dia_1829_jwt_token_auth', value=True)
@pytest.mark.django_db
def test_create_token_when_no_existing_token():
    user = create_user_with_token_settings(api_tokens_enabled=True, legacy_api_tokens_enabled=False)
    client = APIClient()
    refresh = LSAPIToken()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    client.force_authenticate(user)

    response = client.post('/api/token/')

    assert response.status_code == status.HTTP_201_CREATED
    assert 'token' in response.data


@mock_feature_flag(flag_name='fflag__feature_develop__prompts__dia_1829_jwt_token_auth', value=True)
@pytest.mark.django_db
def test_create_token_when_existing_valid_token():
    user = create_user_with_token_settings(api_tokens_enabled=True, legacy_api_tokens_enabled=False)
    client = APIClient()
    refresh = LSAPIToken()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    client.force_authenticate(user)

    # 1. Create first token
    response = client.post('/api/token/')
    assert response.status_code == status.HTTP_201_CREATED

    # 2. Try to create second token
    response = client.post('/api/token/')
    assert response.status_code == status.HTTP_409_CONFLICT
    assert 'detail' in response.data
    assert 'You already have a valid token' in response.data['detail']


@mock_feature_flag(flag_name='fflag__feature_develop__prompts__dia_1829_jwt_token_auth', value=True)
@pytest.mark.django_db
def test_create_token_after_blacklisting_previous():
    user = create_user_with_token_settings(api_tokens_enabled=True, legacy_api_tokens_enabled=False)
    client = APIClient()
    refresh = LSAPIToken()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    client.force_authenticate(user)

    # 1. Create first token
    response = client.post('/api/token/')
    assert response.status_code == status.HTTP_201_CREATED

    # 2. Blacklist the token
    token = response.data['token']
    response = client.post('/api/token/blacklist/', data={'refresh': token})
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # 3. Create new token
    response = client.post('/api/token/')
    assert response.status_code == status.HTTP_201_CREATED
    assert 'token' in response.data
