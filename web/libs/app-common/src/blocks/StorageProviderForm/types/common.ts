import type { CalloutVariant } from "@humansignal/ui";
import type { FC } from "react";
import type { z } from "zod";

// Field types that can be rendered
export type FieldType = "text" | "password" | "number" | "select" | "toggle" | "counter" | "textarea";

// Field definition interface
export interface FieldDefinition {
  name: string;
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  schema: z.ZodType;
  options?: Array<{ value: string | boolean | number; label: string }>; // For select fields
  min?: number; // For number/counter fields
  max?: number; // For number/counter fields
  step?: number; // For number/counter fields
  autoComplete?: string; // For input fields
  gridCols?: number; // How many columns this field should span (1-12)
  accessKey?: boolean; // Whether this field is an access key/credential that should be handled specially in edit mode
}

export interface MessageDefinition {
  name: string;
  type: "message";
  content: JSX.Element;
  gridCols?: number;
  variant?: CalloutVariant;
}

// Layout row definition
export interface LayoutRow {
  fields: string[]; // Array of field names that should be on the same row
  gap?: number; // Gap between fields in the row
}

// Provider configuration interface
export interface ProviderConfig {
  name: string;
  title: string;
  description: string;
  fields: (FieldDefinition | MessageDefinition)[];
  layout: LayoutRow[];
  icon?: FC<any>;
}
