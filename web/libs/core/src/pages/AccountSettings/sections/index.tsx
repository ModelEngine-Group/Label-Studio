import { PersonalInfo } from "./PersonalInfo";
import { EmailPreferences } from "./EmailPreferences";
import { PersonalAccessToken, PersonalAccessTokenDescription } from "./PersonalAccessToken";
import { MembershipInfo } from "./MembershipInfo";
import type React from "react";
import { PersonalJWTToken } from "./PersonalJWTToken";
import type { AuthTokenSettings } from "../types";
import { FF_AUTH_TOKENS, isFF } from "@humansignal/core/lib/utils/feature-flags";
import i18n from 'i18next';

type SectionType = {
  title: string;
  id: string;
  component: React.FC;
  description?: React.FC;
};

export const accountSettingsSections = (settings: AuthTokenSettings): SectionType[] => {
  return [
    {
      title: i18n.t('common_title_personal_info'),
      id: "personal-info",
      component: PersonalInfo,
    },
    {
      title: i18n.t('common_title_email_preference'),
      id: "email-preferences",
      component: EmailPreferences,
    },
    {
      title: i18n.t('common_title_menbership_info'),
      id: "membership-info",
      component: MembershipInfo,
    },
    settings.api_tokens_enabled &&
      isFF(FF_AUTH_TOKENS) && {
      title: i18n.t('common_title_personal_access_token'),
        id: "personal-access-token",
        // component: PersonalAccessToken,
        component: PersonalJWTToken,
        description: PersonalAccessTokenDescription,
      },
    settings.legacy_api_tokens_enabled && {
      title: isFF(FF_AUTH_TOKENS) ? i18n.t('common_title_legacy_token') : i18n.t('common_title_access_token'),
      id: "legacy-token",
      // component: PersonalAccessToken,
      component: PersonalAccessToken,
      description: PersonalAccessTokenDescription,
    },
  ].filter(Boolean) as SectionType[];
};
