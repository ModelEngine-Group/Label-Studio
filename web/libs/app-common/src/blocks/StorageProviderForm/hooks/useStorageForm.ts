import { useCallback, useState, useEffect } from "react";
import { z } from "zod";
import { formatValidationErrors } from "../schemas";
import { getProviderConfig, providerRegistry } from "../providers";
import { extractDefaultValues } from "../types/provider";
import type { FormState } from "../atoms";
import type { FieldDefinition } from "../types/common";
import { isDefined } from "@humansignal/core/lib/utils/helpers";

interface UseStorageFormProps {
  project: number;
  isEditMode: boolean;
  steps: Array<{ title: string; schema?: z.ZodSchema }>;
  storage?: any;
}

export const useStorageForm = ({ project, isEditMode, steps, storage }: UseStorageFormProps) => {
  const [formState, setFormState] = useState<FormState>({
    currentStep: 0,
    formData: {
      project,
      provider: "s3",
      title: "",
      use_blob_urls: false,
      recursive_scan: true,
      regex_filter: "",
    },
    isComplete: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const { currentStep, formData } = formState;

  // Initialize form data with provider defaults when provider changes (only in create mode)
  useEffect(() => {
    if (formData.provider && !isEditMode) {
      const providerConfig = getProviderConfig(formData.provider);
      if (providerConfig) {
        const defaultValues = extractDefaultValues(providerConfig.fields);
        setFormState((prevState) => ({
          ...prevState,
          formData: {
            ...prevState.formData,
            ...defaultValues,
          },
        }));
      }
    }
  }, [formData.provider, setFormState, isEditMode]);

  // Initialize form data with existing storage data in edit mode (only once)
  useEffect(() => {
    if (isEditMode && storage && !isInitialized) {
      const storageType = storage.type || storage.provider || "s3";

      // Wait for providers to be available
      if (Object.keys(providerRegistry).length === 0) {
        return;
      }

      const providerConfig = getProviderConfig(storageType);

      // Debug logging to help identify provider issues
      if (!providerConfig) {
        console.warn(`Provider config not found for storage type: "${storageType}"`, {
          availableProviders: Object.keys(providerRegistry),
          storageType,
        });

        // If no provider config found, we'll still populate the form with existing data
        // but we'll retry when more providers are registered
        return;
      }

      // Prepare form data with placeholder values for access keys
      const formDataWithPlaceholders = { ...storage };

      // Process provider-specific fields
      if (providerConfig) {
        providerConfig.fields.forEach((field) => {
          // Handle access key fields first
          if (field.type !== "message" && field.accessKey) {
            formDataWithPlaceholders[field.name] = "••••••••••••••••";
            return;
          }
          const placeholder = formDataWithPlaceholders[field.name];

          // Handle different field types
          switch (field.type) {
            case "counter":
              // For counter fields, if the value is null, undefined, or 0, use the default from schema
              if (!isDefined(placeholder) || placeholder === 0) {
                try {
                  const schemaAny = field.schema as any;
                  if (schemaAny._def?.defaultValue !== undefined) {
                    const defaultValue =
                      typeof schemaAny._def.defaultValue === "function"
                        ? schemaAny._def.defaultValue()
                        : schemaAny._def.defaultValue;
                    formDataWithPlaceholders[field.name] = defaultValue;
                  } else {
                    formDataWithPlaceholders[field.name] = field.min || 0;
                  }
                } catch (error) {
                  formDataWithPlaceholders[field.name] = field.min || 0;
                }
              }
              break;

            case "text":
            case "password":
            case "textarea":
              // For optional string fields, convert null to empty string
              if (
                !field.required &&
                (formDataWithPlaceholders[field.name] === null || formDataWithPlaceholders[field.name] === undefined)
              ) {
                formDataWithPlaceholders[field.name] = "";
              }
              break;

            case "number":
              // For optional number fields, keep null as is (will be handled by nullable schema)
              // But if it's 0 and the field has a min value, use the min value
              if (!field.required && formDataWithPlaceholders[field.name] === 0 && field.min && field.min > 0) {
                formDataWithPlaceholders[field.name] = field.min;
              }
              break;

            case "toggle":
              // For optional boolean fields, convert null to false
              if (
                !field.required &&
                (formDataWithPlaceholders[field.name] === null || formDataWithPlaceholders[field.name] === undefined)
              ) {
                formDataWithPlaceholders[field.name] = false;
              }
              break;

            case "select":
              // For optional select fields, convert null to empty string
              if (
                !field.required &&
                (formDataWithPlaceholders[field.name] === null || formDataWithPlaceholders[field.name] === undefined)
              ) {
                formDataWithPlaceholders[field.name] = "";
              }
              break;

            case "message":
              // Skip message fields as they don't need processing
              break;

            default:
              // For any other field types, no special processing needed
              break;
          }
        });
      }

      // Always populate the form with existing data, even if provider config is not found
      setFormState((prevState) => {
        const newFormData = {
          ...prevState.formData,
          ...formDataWithPlaceholders, // Load existing storage data with placeholders
          provider: storageType, // Ensure provider is set using the detected type
        };
        return {
          ...prevState,
          currentStep: 0, // Start from first step (Configure Connection in edit mode)
          formData: newFormData,
        };
      });

      // Mark as initialized to prevent re-initialization
      setIsInitialized(true);
    }
  }, [isEditMode, storage, setFormState, isInitialized]); // Removed providerRegistry from dependencies

  // Initialize form data with project when it changes
  useEffect(() => {
    setFormState((prevState) => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        project: project,
      },
    }));
  }, [project, setFormState]);

  // Validate a single field
  const validateSingleField = useCallback(
    (fieldName: string, value: any) => {
      const currentSchema = steps[currentStep]?.schema;
      if (!currentSchema) return true;

      try {
        const fieldSchema = z.object({ [fieldName]: (currentSchema as any).shape[fieldName] });

        fieldSchema.parse({ [fieldName]: value });

        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
        return true;
      } catch (error) {
        console.log("Field validation failed:", error);
        if (error instanceof z.ZodError) {
          const formattedErrors = formatValidationErrors(error);
          setErrors((prev) => ({
            ...prev,
            [fieldName]: formattedErrors[fieldName],
          }));
        }
        return false;
      }
    },
    [currentStep, steps],
  );

  // Validate entire form
  const validateEntireForm = useCallback(() => {
    const currentSchema = steps[currentStep]?.schema;
    if (!currentSchema) return true;

    try {
      currentSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      console.log("Form validation failed:", error);
      if (error instanceof z.ZodError) {
        const formattedErrors = formatValidationErrors(error);
        setErrors(formattedErrors);
        return false;
      }
      return false;
    }
  }, [currentStep, formData, steps]);

  // Handle provider field changes
  const handleProviderFieldChange = useCallback(
    (name: string, value: any, onConnectionChange?: () => void) => {
      // If changing provider, get new defaults first (only in create mode)
      if (name === "provider" && !isEditMode) {
        const providerConfig = getProviderConfig(value);
        if (providerConfig) {
          const defaultValues = extractDefaultValues(providerConfig.fields);
          setFormState((prev) => ({
            ...prev,
            formData: {
              ...prev.formData,
              ...defaultValues,
              [name]: value,
            },
          }));
          return;
        }
      }

      const newFormData = { ...formData, [name]: value };

      setFormState((prev) => ({
        ...prev,
        formData: newFormData,
      }));

      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });

      // Check if this field should reset the connection
      const currentProvider = newFormData.provider || "s3";
      const providerConfig = getProviderConfig(currentProvider);
      const field = providerConfig?.fields.find((f) => f.name === name);

      // Only reset connection if field doesn't explicitly set resetConnection: false
      const shouldResetConnection =
        field && "type" in field ? (field as FieldDefinition).resetConnection !== false : true;

      if (shouldResetConnection) {
        onConnectionChange?.();
      }
    },
    [formData, setFormState, isEditMode],
  );

  // Handle field blur
  const handleFieldBlur = useCallback(
    (name: string, value: any) => {
      validateSingleField(name, value);
    },
    [validateSingleField],
  );

  const setCurrentStep = useCallback(
    (step: number) => {
      setFormState((prevState) => ({
        ...prevState,
        currentStep: step,
      }));
    },
    [setFormState],
  );

  const resetForm = useCallback(() => {
    setFormState({
      currentStep: 0,
      formData: {
        project,
        provider: "s3",
        title: "",
        use_blob_urls: false,
        recursive_scan: true,
        regex_filter: "",
      },
      isComplete: false,
    });
    setErrors({});
    setIsInitialized(false);
  }, [project]);

  return {
    formState,
    setFormState,
    errors,
    setErrors,
    validateSingleField,
    validateEntireForm,
    handleProviderFieldChange,
    handleFieldBlur,
    setCurrentStep,
    resetForm,
  };
};
