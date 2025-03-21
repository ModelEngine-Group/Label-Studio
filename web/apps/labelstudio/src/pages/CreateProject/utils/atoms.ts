import { isDefined } from "@humansignal/core/lib/utils/helpers";
import { API } from "apps/labelstudio/src/providers/ApiProvider";
import { projectAtom } from "apps/labelstudio/src/providers/ProjectProvider";
import { atomWithQuery } from "jotai-tanstack-query";

export const sampleDatasetAtom = atomWithQuery((get) => {
  const project = get(projectAtom);
  const labelConfig = project?.label_config;
  return {
    queryKey: [labelConfig, project, "sample-data"],
    enabled: isDefined(labelConfig) && labelConfig !== "<View></View>",
    async queryFn() {
      const response = await API.invoke(
        "createSampleTask",
        { pk: project.id },
        {
          body: {
            label_config: project?.label_config ?? "<View></View>",
            include_annotation_and_prediction: true,
          },
        },
      );

      let json: Record<string, any> = response ?? {};

      if (!response.$meta.ok) json = { error: "Can't prepare sample data." };
      return JSON.stringify(json, null, "  ");
    },
  };
});
