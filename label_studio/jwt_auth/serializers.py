from jwt_auth.models import JWTSettings, LSAPIToken, TruncatedLSAPIToken
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenBlacklistSerializer


# Recommended implementation from JWT to support drf-yasg:
# https://django-rest-framework-simplejwt.readthedocs.io/en/latest/drf_yasg_integration.html
class TokenRefreshResponseSerializer(serializers.Serializer):
    access = serializers.CharField()


class JWTSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = JWTSettings
        fields = ('api_tokens_enabled', 'legacy_api_tokens_enabled')


class LSAPITokenCreateSerializer(serializers.Serializer):
    token = serializers.SerializerMethodField()

    def get_token(self, obj):
        return obj.get_full_jwt()

    class Meta:
        model = LSAPIToken
        fields = ['token']


class LSAPITokenListSerializer(LSAPITokenCreateSerializer):
    def get_token(self, obj):
        # only return header/payload portion of token, using LSTokenBackend
        return str(obj)


class LSAPITokenBlacklistSerializer(TokenBlacklistSerializer):
    token_class = TruncatedLSAPIToken
