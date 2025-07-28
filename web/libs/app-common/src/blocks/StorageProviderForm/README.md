# Storage Provider Configuration System

This system allows you to easily add new storage providers by defining their configuration in a declarative way.

## How to Add a New Provider

### 1. Create Provider Configuration

Create a new file in `providers/` directory (e.g., `providers/myProvider.ts`):

```typescript
import { z } from "zod";
import { ProviderConfig } from "../types/provider";

export const myProvider: ProviderConfig = {
  name: "myprovider",
  title: "My Storage Provider",
  description: "Configure your My Storage Provider connection",
  fields: [
    {
      name: "api_key",
      type: "password",
      label: "API Key",
      required: true,
      placeholder: "Enter your API key",
      schema: z.string().min(1, "API Key is required"),
    },
    {
      name: "endpoint",
      type: "text",
      label: "API Endpoint",
      required: true,
      placeholder: "https://api.mystorage.com",
      schema: z.string().url("Must be a valid URL"),
    },
    {
      name: "use_ssl",
      type: "toggle",
      label: "Use SSL",
      description: "Enable SSL for secure connections",
      schema: z.boolean().default(true), // Default value defined in schema
    },
    {
      name: "timeout",
      type: "counter",
      label: "Connection Timeout (seconds)",
      min: 1,
      max: 300,
      step: 5,
      schema: z.number().min(1).max(300).default(30), // Default value defined in schema
    },
  ],
  layout: [
    {
      fields: ["api_key"],
    },
    {
      fields: ["endpoint"],
    },
    {
      fields: ["use_ssl", "timeout"],
    },
  ],
};
```

### 2. Register the Provider

Add your provider to the registry in `providers/index.ts`:

```typescript
import { myProvider } from "./myProvider";

export const providerRegistry: Record<string, ProviderConfig> = {
  s3: s3Provider,
  gcp: gcpProvider,
  azure: azureProvider,
  redis: redisProvider,
  localfiles: localFilesProvider,
  myprovider: myProvider, // Add your provider here
};
```

## Field Types

### Available Field Types

- `text`: Regular text input
- `password`: Password input (hidden)
- `number`: Numeric input
- `select`: Dropdown selection
- `toggle`: Boolean toggle switch
- `counter`: Numeric counter with min/max
- `textarea`: Multi-line text input

### Field Properties

```typescript
{
  name: string;           // Field name (used in form data)
  type: FieldType;        // Field type (see above)
  label: string;          // Display label
  description?: string;   // Help text
  placeholder?: string;   // Placeholder text
  required?: boolean;     // Whether field is required
  schema: z.ZodTypeAny;  // Zod validation schema with defaults
  options?: Array<{ value: string; label: string }>; // For select fields
  min?: number;          // For number/counter fields
  max?: number;          // For number/counter fields
  step?: number;         // For number/counter fields
  autoComplete?: string; // For input fields
  gridCols?: number;     // How many columns this field should span (1-12)
}
```

## Default Values

Default values are now defined directly in the Zod schema using `.default()`:

```typescript
{
  name: "use_ssl",
  type: "toggle",
  label: "Use SSL",
  schema: z.boolean().default(true), // Default: true
},
{
  name: "timeout",
  type: "counter",
  label: "Connection Timeout",
  schema: z.number().min(1).max(300).default(30), // Default: 30
},
{
  name: "region",
  type: "select",
  label: "Region",
  schema: z.string().default("us-east-1"), // Default: "us-east-1"
},
```

The system automatically extracts these default values from the schemas using the `extractDefaultValues()` function.

## Layout Configuration

The `layout` array defines how fields are arranged in rows:

```typescript
layout: [
  {
    fields: ["field1"],           // Single field on one row
  },
  {
    fields: ["field2", "field3"], // Two fields on the same row
  },
  {
    fields: ["field4"],           // Another single field
  },
]
```

## Validation

Each field includes a Zod schema for validation:

```typescript
{
  name: "api_key",
  type: "password",
  label: "API Key",
  required: true,
  schema: z.string().min(1, "API Key is required"),
}
```

The system automatically assembles all field schemas into a complete validation schema for the entire form.

## Helper Functions

The system provides several helper functions:

- `getProviderConfig(providerName)`: Get provider configuration
- `getProviderSchema(providerName)`: Get validation schema for provider
- `getProviderDefaultValues(providerName)`: Get default values for provider
- `extractDefaultValues(fields)`: Extract defaults from field schemas

## Example: Complete Provider

See `providers/example.ts` for a complete example of a new provider configuration.

## Benefits

1. **Declarative**: Define providers in a simple configuration object
2. **Type-safe**: Full TypeScript support with Zod validation
3. **Flexible**: Easy to add new field types and layouts
4. **Maintainable**: All provider logic in one place
5. **Consistent**: All providers follow the same structure
6. **Extensible**: Easy to add new features to all providers at once
7. **Single Source of Truth**: Default values are defined in the schema, not separately

## Migration from Old System

The old system used hardcoded React components for each provider. The new system:

1. Uses a generic `ProviderForm` component
2. Renders fields based on configuration
3. Handles validation automatically
4. Makes adding new providers much easier
5. Uses Zod schemas for both validation and defaults

To migrate an existing provider:

1. Extract field definitions from the old component
2. Create a new provider configuration file
3. Define the layout and validation schemas with defaults
4. Register the provider in the registry
5. Remove the old component file 