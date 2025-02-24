import logging
from datetime import datetime

from core.permissions import all_permissions
from django.utils.decorators import method_decorator
from drf_yasg.utils import swagger_auto_schema
from jwt_auth.models import JWTSettings, LSAPIToken, TruncatedLSAPIToken
from jwt_auth.serializers import (
    JWTSettingsSerializer,
    LSAPITokenCreateSerializer,
    LSAPITokenListSerializer,
    TokenRefreshResponseSerializer,
)
from rest_framework import generics, status
from rest_framework.exceptions import APIException
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenBackendError, TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.views import TokenRefreshView, TokenViewBase

logger = logging.getLogger(__name__)


class TokenExistsError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'You already have a valid token. Please revoke it before creating a new one.'
    default_code = 'token_exists'


@method_decorator(
    name='get',
    decorator=swagger_auto_schema(
        tags=['JWT'],
        operation_summary='Retrieve JWT Settings',
        operation_description='Retrieve JWT settings for the currently active organization.',
    ),
)
@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        tags=['JWT'],
        operation_summary='Update JWT Settings',
        operation_description='Update JWT settings for the currently active organization.',
    ),
)
class JWTSettingsAPI(CreateAPIView):
    queryset = JWTSettings.objects.all()
    permission_required = all_permissions.organizations_change
    serializer_class = JWTSettingsSerializer

    def get(self, request, *args, **kwargs):
        jwt_settings = request.user.active_organization.jwt
        return Response(self.get_serializer(jwt_settings).data)

    def post(self, request, *args, **kwargs):
        jwt_settings = request.user.active_organization.jwt
        serializer = self.get_serializer(data=request.data, instance=jwt_settings)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# Recommended implementation from JWT to support drf-yasg:
# https://django-rest-framework-simplejwt.readthedocs.io/en/latest/drf_yasg_integration.html
class DecoratedTokenRefreshView(TokenRefreshView):
    @swagger_auto_schema(
        tags=['JWT'],
        responses={
            status.HTTP_200_OK: TokenRefreshResponseSerializer,
        },
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


@method_decorator(
    name='get',
    decorator=swagger_auto_schema(
        tags=['JWT'],
        operation_summary='List API tokens',
        operation_description='List all API tokens for the current user.',
    ),
)
@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        tags=['JWT'],
        operation_summary='Create API token',
        operation_description='Create a new API token for the current user.',
    ),
)
class LSAPITokenView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    token_class = LSAPIToken

    def get_queryset(self):
        """Returns all non-expired non-blacklisted tokens for the current user.

        The `list` method handles filtering for refresh tokens (as opposed to access tokens),
        since simple-jwt makes it hard to do this at the DB level."""
        # Notably, if the list of non-expired blacklisted tokens ever gets too long
        # (e.g. users from orgs who have not set a token expiration for their org
        # revoke enough tokens for this to blow up), this will become inefficient.
        # Would be ideal to just add a "blacklisted" attr to our own subclass of
        # OutstandingToken so we can check at that level, or just clean up
        # OutstandingTokens that have been blacklisted every so often.
        current_blacklisted_tokens = BlacklistedToken.objects.filter(token__expires_at__gt=datetime.now()).values_list(
            'token_id', flat=True
        )
        return OutstandingToken.objects.filter(user_id=self.request.user.id, expires_at__gt=datetime.now()).exclude(
            id__in=current_blacklisted_tokens
        )

    def list(self, request, *args, **kwargs):
        all_tokens = self.get_queryset()

        def _maybe_get_token(token: OutstandingToken):
            try:
                return TruncatedLSAPIToken(str(token.token))
            except (TokenError, TokenBackendError) as e:  # expired/invalid token
                logger.debug('JWT API token validation failed: %s', e)
                return None

        # Annoyingly, token_type not stored directly so we have to filter it here.
        # Shouldn't be many unexpired tokens to iterate through.
        token_objects = list(filter(None, [_maybe_get_token(token) for token in all_tokens]))
        refresh_tokens = [tok for tok in token_objects if tok['token_type'] == 'refresh']

        serializer = self.get_serializer(refresh_tokens, many=True)
        data = serializer.data
        return Response(data)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LSAPITokenCreateSerializer
        return LSAPITokenListSerializer

    def perform_create(self, serializer):
        # Check for existing valid tokens
        existing_tokens = self.get_queryset()
        if existing_tokens.exists():
            raise TokenExistsError()

        token = self.token_class.for_user(self.request.user)
        serializer.instance = token


class LSTokenBlacklistView(TokenViewBase):
    _serializer_class = 'jwt_auth.serializers.LSAPITokenBlacklistSerializer'

    @swagger_auto_schema(
        tags=['JWT'],
        operation_summary='Blacklist a JWT refresh token',
        operation_description='Adds a JWT refresh token to the blacklist, preventing it from being used to obtain new access tokens.',
        responses={
            status.HTTP_204_NO_CONTENT: 'Token was successfully blacklisted',
            status.HTTP_404_NOT_FOUND: 'Token is already blacklisted',
        },
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            # Notably, simple jwt's serializer (which we inherit from) calls
            # .blacklist() on the token under the hood
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            return Response({'detail': str(e)}, status=status.HTTP_404_NOT_FOUND)

        return Response(status=status.HTTP_204_NO_CONTENT)
