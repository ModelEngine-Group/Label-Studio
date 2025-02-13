import { API } from "apps/labelstudio/src/providers/ApiProvider";
import { atomWithMutation, atomWithQuery, queryClientAtom } from "jotai-tanstack-query";

type AuthTokenSettings = {
  api_tokens_enabled: boolean;
  legacy_api_tokens_enabled: boolean;
  time_to_live: number;
};

export const TOKEN_SETTINGS_KEY = "api-settings";

export const settingsAtom = atomWithQuery(() => ({
  queryKey: [TOKEN_SETTINGS_KEY],
  async queryFn() {
    const result = await API.invoke("accessTokenSettings");

    if (!result.$meta.ok) {
      return { error: true };
    }

    return result as AuthTokenSettings;
  },
}));

export const saveSettingsAtom = atomWithMutation((get) => {
  const queryClient = get(queryClientAtom);
  return {
    mutationKey: ["api-settings-save"],
    async mutationFn(settings: Partial<AuthTokenSettings>) {
      const result = await API.invoke(
        "accessTokenUpdateSettings",
        {},
        {
          body: settings,
        },
      );

      if (!result.$meta.ok) {
        throw new Error(result.error);
      }

      return result as Partial<AuthTokenSettings>;
    },
    async onMutate(settings: Partial<AuthTokenSettings>) {
      await queryClient.cancelQueries({ queryKey: [TOKEN_SETTINGS_KEY] });
      const previousSettings = queryClient.getQueryData([TOKEN_SETTINGS_KEY]) as AuthTokenSettings;
      queryClient.setQueryData(
        [TOKEN_SETTINGS_KEY],
        (old: AuthTokenSettings[]) => ({ ...previousSettings, ...settings }) as AuthTokenSettings,
      );

      return { previousSettings };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData([TOKEN_SETTINGS_KEY], context?.previousSettings);
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: [TOKEN_SETTINGS_KEY] });
    },
  };
});
