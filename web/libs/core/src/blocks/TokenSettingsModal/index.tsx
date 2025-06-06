import { useAtomValue } from "jotai";
import { settingsAtom, TOKEN_SETTINGS_KEY } from "@humansignal/core/pages/AccountSettings/atoms";
import { queryClientAtom } from "jotai-tanstack-query";

import { Form, Input, Toggle } from "apps/labelstudio/src/components/Form";
import { Button } from "apps/labelstudio/src/components/Button/Button";
import type { AuthTokenSettings } from "@humansignal/core/pages/AccountSettings/types";
import { type ChangeEvent, useState } from "react";
import { useTranslation } from "react-i18next";

export const TokenSettingsModal = ({
  showTTL,
  onSaved,
}: {
  showTTL?: boolean;
  onSaved?: () => void;
}) => {
  const settings = useAtomValue(settingsAtom);
  if (!settings.isSuccess || settings.isError || "error" in settings.data) {
    return <div>Error loading settings.</div>;
  }
  return (
    <TokenSettingsModalView
      key={settings.data?.api_tokens_enabled}
      settings={settings.data}
      showTTL={showTTL}
      onSaved={onSaved}
    />
  );
};

function TokenSettingsModalView({
  settings,
  showTTL,
  onSaved,
}: { settings: AuthTokenSettings; showTTL?: boolean; onSaved?: () => void }) {
  const { t } = useTranslation();
  const [enableTTL, setEnableTTL] = useState(settings.api_tokens_enabled);
  const queryClient = useAtomValue(queryClientAtom);
  const reloadSettings = () => {
    queryClient.invalidateQueries({ queryKey: [TOKEN_SETTINGS_KEY] });
    onSaved?.();
  };
  return (
    <Form action="accessTokenUpdateSettings" onSubmit={reloadSettings}>
      <Form.Row columnCount={1}>
        <Toggle
          label={t('common_label_personal_access_tokens')}
          name="api_tokens_enabled"
          description={t('common_description_for_personal_access_tokens')}
          checked={settings.api_tokens_enabled ?? false}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEnableTTL(e.target.checked)}
        />
      </Form.Row>
      <Form.Row columnCount={1}>
        <Toggle
          label={t('common_label_legacy_tokens')}
          name="legacy_api_tokens_enabled"
          description={t('common_description_for_legacy_tokens')}
          checked={settings.legacy_api_tokens_enabled ?? true}
        />
      </Form.Row>
      {showTTL === true && (
        <Form.Row columnCount={1}>
          <Input
            name="api_token_ttl_days"
            label={t('common_label_time_to_live')}
            description={t('common_description_for_time_to_live')}
            labelProps={{
              description:
              t('common_description_for_time_to_live'),
            }}
            disabled={!enableTTL}
            type="number"
            min={10}
            max={365}
            value={settings.api_token_ttl_days ?? 30}
          />
        </Form.Row>
      )}
      <Form.Actions>
        <Button type="submit">{t('common_button_save')}</Button>
      </Form.Actions>
    </Form>
  );
}
