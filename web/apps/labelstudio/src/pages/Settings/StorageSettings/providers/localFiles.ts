import { z } from "zod";
import type { ProviderConfig } from "@humansignal/app-common/blocks/StorageProviderForm/types/provider";
import { IconDocument } from "@humansignal/icons";

export const localFilesProvider: ProviderConfig = {
  name: "localfiles",
  title: "Local Files",
  description: "Configure your local file storage connection with all required Label Studio settings",
  icon: IconDocument,
  fields: [
    {
      name: "path",
      type: "text",
      label: "Absolute local path",
      required: true,
      placeholder: "/data/my-folder/",
      schema: z.string().min(1, "Path is required"),
    },
  ],
  layout: [
    {
      fields: ["path"],
    },
  ],
};

export default localFilesProvider;
