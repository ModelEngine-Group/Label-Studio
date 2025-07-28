import { useContext, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { ApiContext } from "apps/labelstudio/src/providers/ApiProvider";
import { isDefined } from "apps/labelstudio/src/utils/helpers";

interface UseStorageApiProps {
  target?: "import" | "export";
  storage?: any;
  project?: number;
  onSubmit: () => void;
  onClose: () => void;
}

export const useStorageApi = ({ target, storage, project, onSubmit, onClose }: UseStorageApiProps) => {
  const api = useContext(ApiContext);
  const isEditMode = Boolean(storage);
  const action = storage ? "updateStorage" : "createStorage";

  // Clean form data for submission
  const cleanFormDataForSubmission = useCallback(
    (data: any) => {
      if (!isEditMode) return data;

      const cleanedData = { ...data };
      // Remove empty access key fields in edit mode
      Object.keys(cleanedData).forEach((key) => {
        if (cleanedData[key] === "" || cleanedData[key] === undefined || cleanedData[key] === "••••••••••••••••") {
          delete cleanedData[key];
        }
      });

      return cleanedData;
    },
    [isEditMode],
  );

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (connectionData: any) => {
      if (!api) throw new Error("API context not available");

      const cleanedData = cleanFormDataForSubmission(connectionData);
      const body = { ...cleanedData };

      if (isDefined(storage?.id)) {
        body.id = storage.id;
      }

      const result = await api.callApi("validateStorage", {
        params: {
          target,
          type: connectionData.provider,
        },
        body,
      });
      console.log(result);
      return result;
    },
  });

  // Create/Update storage mutation
  const createStorageMutation = useMutation({
    mutationFn: async (storageData: any) => {
      if (!api) throw new Error("API context not available");

      const cleanedData = cleanFormDataForSubmission(storageData);
      const body = { ...cleanedData };

      if (isDefined(storage?.id)) {
        body.id = storage.id;
      }

      return api.callApi(action, {
        params: { target, type: storageData.provider, project, pk: storage?.id },
        body,
      });
    },
    onSuccess: (response) => {
      if (response?.$meta?.ok) {
        onSubmit();
        onClose();
      }
    },
  });

  // Load files preview mutation
  const loadFilesPreviewMutation = useMutation({
    mutationFn: async (previewData: any) => {
      if (!api) throw new Error("API context not available");

      const cleanedData = cleanFormDataForSubmission(previewData);
      const body = { ...cleanedData };

      if (isDefined(storage?.id)) {
        body.id = storage.id;
      }

      return api.callApi<{ files: any[] }>("storageFiles", {
        params: {
          limit: 10,
          target,
          type: previewData.provider,
        },
        body,
      });
    },
  });

  return {
    testConnectionMutation,
    createStorageMutation,
    loadFilesPreviewMutation,
    isEditMode,
    action,
  };
};
