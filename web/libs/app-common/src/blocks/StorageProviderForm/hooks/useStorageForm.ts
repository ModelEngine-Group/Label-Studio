import { useCallback, useState, useEffect } from "react";
import { useAtom } from "jotai";
import { z } from "zod";
import { formStateAtom } from "../atoms";
import { formatValidationErrors } from "../schemas";
import { getProviderConfig } from "../providers";
import { extractDefaultValues } from "../types/provider";

interface UseStorageFormProps {
  project: number;
  isEditMode: boolean;
  steps: Array<{ title: string; schema?: z.ZodSchema }>;
  storage?: any;
}

export const useStorageForm = ({ project, isEditMode, steps, storage }: UseStorageFormProps) => {
  const [formState, setFormState] = useAtom(formStateAtom);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { currentStep, formData } = formState;

  // Initialize form data with provider defaults when provider changes
  useEffect(() => {
    if (formData.provider) {
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
  }, [formData.provider, setFormState]);

  // Initialize form data with existing storage data in edit mode
  useEffect(() => {
    if (isEditMode && storage) {
      const providerConfig = getProviderConfig(storage.type || storage.provider || "s3");

      // Prepare form data with placeholder values for access keys
      const formDataWithPlaceholders = { ...storage };

      if (providerConfig) {
        providerConfig.fields.forEach((field) => {
          if (field.type !== "message" && field.accessKey) {
            // Fill access key fields with placeholder values in edit mode
            formDataWithPlaceholders[field.name] = "••••••••••••••••";
          } else if (field.type === "counter") {
            // For counter fields, if the value is null, undefined, or 0, use the default from schema
            if (
              formDataWithPlaceholders[field.name] === null ||
              formDataWithPlaceholders[field.name] === undefined ||
              formDataWithPlaceholders[field.name] === 0
            ) {
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
          }
        });
      }

      setFormState((prevState) => ({
        ...prevState,
        currentStep: 0, // Start from first step (Configure Connection in edit mode)
        formData: {
          ...prevState.formData,
          ...formDataWithPlaceholders, // Load existing storage data with placeholders
          provider: storage.type || storage.provider || "s3", // Ensure provider is set
        },
      }));
    }
  }, [isEditMode, storage, setFormState]);

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
      console.log(error, currentSchema);
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
      // If changing provider, get new defaults first
      if (name === "provider") {
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

      // Reset validation state when connection settings change
      const connectionFields = [
        "bucket",
        "container",
        "path",
        "host",
        "port",
        "db",
        "password",
        "account_name",
        "account_key",
        "google_application_credentials",
        "region_name",
        "s3_endpoint",
      ];
      if (connectionFields.includes(name)) {
        onConnectionChange?.();
      }
    },
    [formData, setFormState],
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
  }, [project, setFormState]);

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
