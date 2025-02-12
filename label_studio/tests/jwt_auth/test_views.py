import pytest
from jwt_auth.models import LSAPIToken
from rest_framework import status
from rest_framework_simplejwt.exceptions import TokenError

from ..utils import mock_feature_flag
from .utils import create_user_with_token_settings


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
