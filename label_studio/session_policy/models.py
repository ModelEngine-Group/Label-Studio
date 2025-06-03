from annoying.fields import AutoOneToOneField
from django.db import models
from django.utils.translation import gettext_lazy as _
from organizations.models import Organization


class SessionTimeoutPolicy(models.Model):
    """Organization-specific session timeout policy configuration"""

    organization = AutoOneToOneField(
        Organization, related_name='session_timeout_policy', primary_key=True, on_delete=models.DO_NOTHING
    )

    max_session_age = models.IntegerField(
        _('Max session age (hours)'),
        default=192,  # 8 days
        help_text='Number of hours that a session can be active before needing to re-login',
    )

    max_time_between_activity = models.IntegerField(
        _('Max time (hours) between activity'),
        default=72,  # 3 days
        help_text='Number of hours that a session stays active without any activity',
    )

    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
