import { Form, Input, Toggle } from "../../../../../components/Form";
import { useAtomValue } from "jotai";
import { formDataToJPO } from "@humansignal/core/lib/utils/helpers";
import { saveSettingsAtom, settingsAtom } from "@humansignal/core/pages/AccountSettings/atoms";
import type { AuthTokenSettings } from "@humansignal/core/pages/AccountSettings/types";
import type { FormEventHandler } from "react";

export const TokenSettingsModal = () => {
  const settings = useAtomValue(settingsAtom);
  const { mutate: saveSettings } = useAtomValue(saveSettingsAtom);
  const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    const data = formDataToJPO(new FormData(e.currentTarget));
    const body = {
      api_tokens_enabled: data.api_tokens_enabled === "on",
      legacy_api_tokens_enabled: data.legacy_api_tokens_enabled === "on",
    } satisfies Partial<AuthTokenSettings>;
    saveSettings(body);
  };
  return (
    <Form onChange={onSubmit}>
      <Form.Row columnCount={1}>
        <Toggle
          label="Personal Access Tokens"
          name="api_tokens_enabled"
          description="Enable increased token authentication security"
          checked={settings.data?.api_tokens_enabled ?? false}
        />
      </Form.Row>
      <Form.Row columnCount={1}>
        <Toggle
          label="Legacy Tokens"
          name="legacy_api_tokens_enabled"
          description="Enable legacy access tokens"
          checked={settings.data?.legacy_api_tokens_enabled}
        />
      </Form.Row>
      {window.APP_SETTINGS.billing && (
        <Form.Row columnCount={1}>
          <Input
            name="time_to_live"
            label="Personal Access Token Time-to-Live"
            description="The number of days, after creation, that the token will be valid for. After this time period a user will need to create a new access token"
            labelProps={{
              description:
                "The number of days, after creation, that the token will be valid for. After this time period a user will need to create a new access token",
            }}
            disabled={!settings.data?.api_tokens_enabled}
            value={settings.data?.time_to_live ?? 30}
          />
        </Form.Row>
      )}
    </Form>
  );
};
