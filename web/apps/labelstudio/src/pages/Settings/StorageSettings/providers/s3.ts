import { z } from "zod";
import type { ProviderConfig } from "@humansignal/app-common/blocks/StorageProviderForm/types/provider";
import { IconCloudProviderS3 } from "@humansignal/icons";

export const s3Provider: ProviderConfig = {
  name: "s3",
  title: "Amazon S3",
  description: "Configure your AWS S3 connection with all required Label Studio settings",
  icon: IconCloudProviderS3,
  fields: [
    {
      name: "bucket",
      type: "text",
      label: "Bucket Name",
      required: true,
      placeholder: "my-storage-bucket",
      schema: z.string().min(1, "Bucket name is required"),
    },
    {
      name: "region_name",
      type: "text",
      label: "Region Name",
      placeholder: "us-east-1",
      schema: z.string().optional().default(""),
    },
    {
      name: "s3_endpoint",
      type: "text",
      label: "S3 Endpoint",
      placeholder: "https://s3.amazonaws.com",
      schema: z.string().optional().default(""),
    },
    {
      name: "aws_access_key_id",
      type: "password",
      label: "Access Key ID",
      required: true,
      placeholder: "AKIAIOSFODNN7EXAMPLE",
      autoComplete: "off",
      accessKey: true,
      schema: z.string().min(1, "Access Key ID is required"),
    },
    {
      name: "aws_secret_access_key",
      type: "password",
      label: "Secret Access Key",
      required: true,
      placeholder: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      autoComplete: "new-password",
      accessKey: true,
      schema: z.string().min(1, "Secret Access Key is required"),
    },
    {
      name: "aws_session_token",
      type: "password",
      label: "Session Token",
      placeholder: "Session token (optional)",
      autoComplete: "new-password",
      schema: z.string().optional().default(""),
    },
    {
      name: "presign",
      type: "toggle",
      label: "Use pre-signed URLs (On) / Proxy through the platform (Off)",
      description:
        "When pre-signed URLs are enabled, all data bypasses the platform and user browsers directly read data from storage",
      schema: z.boolean().default(true),
    },
    {
      name: "presign_ttl",
      type: "counter",
      label: "Expire pre-signed URLs (minutes)",
      min: 1,
      max: 10080,
      step: 1,
      schema: z.number().min(1).max(10080).default(15),
    },
  ],
  layout: [
    {
      fields: ["bucket"],
    },
    {
      fields: ["region_name", "s3_endpoint"],
    },
    {
      fields: ["aws_access_key_id", "aws_secret_access_key", "aws_session_token"],
    },
    {
      fields: ["presign", "presign_ttl"],
    },
  ],
};
