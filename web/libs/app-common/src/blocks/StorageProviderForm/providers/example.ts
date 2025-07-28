import { z } from "zod";
import type { ProviderConfig } from "../types/provider";

// Example: Adding a new provider is now as simple as defining this configuration
export const exampleProvider: ProviderConfig = {
  name: "example",
  title: "Example Storage Provider",
  description: "This is an example of how easy it is to add new providers",
  fields: [
    {
      name: "api_key",
      type: "password",
      label: "API Key",
      required: true,
      placeholder: "Enter your API key",
      accessKey: true,
      schema: z.string().min(1, "API Key is required"),
    },
    {
      name: "endpoint",
      type: "text",
      label: "API Endpoint",
      required: true,
      placeholder: "https://api.example.com",
      schema: z.string().url("Must be a valid URL"),
    },
    {
      name: "bucket_name",
      type: "text",
      label: "Bucket Name",
      required: true,
      placeholder: "my-bucket",
      schema: z.string().min(1, "Bucket name is required"),
    },
    {
      name: "region",
      type: "select",
      label: "Region",
      required: true,
      schema: z.string().min(1, "Region is required").default("us-east-1"),
      options: [
        { value: "us-east-1", label: "US East (N. Virginia)" },
        { value: "us-west-2", label: "US West (Oregon)" },
        { value: "eu-west-1", label: "Europe (Ireland)" },
        { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
      ],
    },
    {
      name: "use_ssl",
      type: "toggle",
      label: "Use SSL",
      description: "Enable SSL for secure connections",
      schema: z.boolean().default(true),
    },
    {
      name: "timeout",
      type: "counter",
      label: "Connection Timeout (seconds)",
      min: 1,
      max: 300,
      step: 5,
      schema: z.number().min(1).max(300).default(30),
    },
  ],
  layout: [
    {
      fields: ["api_key"],
    },
    {
      fields: ["endpoint", "bucket_name"],
    },
    {
      fields: ["region"],
    },
    {
      fields: ["use_ssl", "timeout"],
    },
  ],
};
