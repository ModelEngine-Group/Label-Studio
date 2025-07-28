import { z } from "zod";
import type { FieldDefinition, MessageDefinition, ProviderConfig } from "./common";

// Re-export ProviderConfig for convenience
export type { ProviderConfig };

// Helper function to assemble the complete schema from field definitions
export function assembleSchema(fields: FieldDefinition[], isEditMode = false): z.ZodObject<any> {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field) => {
    let fieldSchema = field.schema;

    // For access keys in edit mode, make them optional and skip validation
    if (field.accessKey && isEditMode) {
      fieldSchema = fieldSchema.optional();
    } else if (field.required && fieldSchema instanceof z.ZodString) {
      // Make field required if specified (only in create mode or for non-access-key fields)
      fieldSchema = fieldSchema.min(1, `${field.label} is required`);
    }

    schemaObject[field.name] = fieldSchema;
  });

  return z.object(schemaObject);
}

// Helper function to extract default values from Zod schemas
export function extractDefaultValues(fields: (FieldDefinition | MessageDefinition)[]): Record<string, any> {
  const defaultValues: Record<string, any> = {};

  fields.forEach((field) => {
    if (field.type === "message") return;
    try {
      // Try to get the default value from the schema by accessing the internal structure
      const schemaAny = field.schema as any;
      let defaultValue = undefined;

      // Check different possible locations for default values in Zod schemas
      if (schemaAny._def?.defaultValue !== undefined) {
        defaultValue =
          typeof schemaAny._def.defaultValue === "function"
            ? schemaAny._def.defaultValue()
            : schemaAny._def.defaultValue;
      } else if (schemaAny._def?.innerType?._def?.defaultValue !== undefined) {
        defaultValue =
          typeof schemaAny._def.innerType._def.defaultValue === "function"
            ? schemaAny._def.innerType._def.defaultValue()
            : schemaAny._def.innerType._def.defaultValue;
      } else if (schemaAny._def?.typeName === "ZodDefault") {
        defaultValue =
          typeof schemaAny._def.innerType._def.defaultValue === "function"
            ? schemaAny._def.innerType._def.defaultValue()
            : schemaAny._def.innerType._def.defaultValue;
      }

      if (defaultValue !== undefined) {
        defaultValues[field.name] = defaultValue;
      } else {
        // Set appropriate defaults based on field type
        switch (field.type) {
          case "text":
          case "password":
          case "textarea":
            defaultValues[field.name] = "";
            break;
          case "number":
          case "counter":
            defaultValues[field.name] = field.min || 0;
            break;
          case "select":
            defaultValues[field.name] = field.options?.[0]?.value || "";
            break;
          case "toggle":
            defaultValues[field.name] = false;
            break;
        }
      }
    } catch (error) {
      // If we can't extract the default, use type-based defaults
      switch (field.type) {
        case "text":
        case "password":
        case "textarea":
          defaultValues[field.name] = "";
          break;
        case "number":
        case "counter":
          defaultValues[field.name] = field.min || 0;
          break;
        case "select":
          defaultValues[field.name] = field.options?.[0]?.value || "";
          break;
        case "toggle":
          defaultValues[field.name] = false;
          break;
      }
    }
  });

  return defaultValues;
}

// Helper function to get field by name
export function getFieldByName(
  fields: (FieldDefinition | MessageDefinition)[],
  name: string,
): FieldDefinition | MessageDefinition | undefined {
  return fields.find((field) => field.name === name);
}

// Helper function to get fields for a specific row
export function getFieldsForRow(
  fields: (FieldDefinition | MessageDefinition)[],
  rowFields: string[],
): (FieldDefinition | MessageDefinition)[] {
  return rowFields.map((fieldName) => getFieldByName(fields, fieldName)).filter(Boolean) as FieldDefinition[];
}
