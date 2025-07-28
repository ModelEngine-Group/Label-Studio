import { z } from "zod";
import type { FieldDefinition } from "./types/common";
import { getProviderConfig } from "./providers";
import { assembleSchema } from "./types/provider";

// Step validation schemas
export const step1Schema = z.object({
  provider: z.string().min(1, "Please select a storage provider"),
});

// Helper function to get provider-specific schema
export const getProviderSchema = (provider: string, isEditMode = false) => {
  const providerConfig = getProviderConfig(provider);
  if (!providerConfig) {
    return z.object({}); // Empty schema for unknown providers
  }

  // Combine provider-specific fields with common fields like title
  const commonFields: FieldDefinition[] = [
    {
      name: "title",
      type: "text",
      label: "Storage Title",
      required: true,
      schema: z.string().min(1, "Storage title is required"),
    },
  ];

  // Filter out message fields and combine with common fields
  const providerFields = providerConfig.fields.filter(
    (field): field is FieldDefinition => "type" in field && field.type !== "message",
  );

  const allFields = [...commonFields, ...providerFields];
  return assembleSchema(allFields, isEditMode);
};

// Helper function to format validation errors in human-friendly format
export const formatValidationErrors = (zodError: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};

  zodError.issues.forEach((issue) => {
    const fieldName = issue.path.join(".");
    if (fieldName) {
      errors[fieldName] = issue.message;
    }
  });

  return errors;
};
