import { forwardRef, useEffect, useState } from "react";
import { useModalControls } from "apps/labelstudio/src/components/Modal/ModalPopup";
import { Stepper, ProviderSelectionStep, ProviderDetailsStep, PreviewStep, ReviewStep } from "./Steps";
import { FormHeader } from "./components/form-header";
import { FormFooter } from "./components/form-footer";
import { useStorageForm } from "./hooks/useStorageForm";
import { useStorageApi } from "./hooks/useStorageApi";
import { step1Schema, getProviderSchema } from "./schemas";
import { addProvider } from "./providers";
import type { ProviderConfig } from "./types/provider";

interface StorageProviderFormProps {
  onSubmit: () => void;
  target?: "import" | "export";
  project?: any;
  storage?: any;
  title?: string;
  storageTypes: {
    title: string;
    name: string;
  }[];
  providers: Record<string, ProviderConfig>;
  onClose?: () => void;
  onHide?: () => void;
}

export const StorageProviderForm = forwardRef<unknown, StorageProviderFormProps>(
  ({ onSubmit, target, project, storage, title, storageTypes, providers, onClose = () => {}, onHide }, ref) => {
    const modal = useModalControls();
    const [type, setType] = useState<string | undefined>("s3");
    const [filesPreview, setFilesPreview] = useState<any[] | null>(null);
    const [connectionChecked, setConnectionChecked] = useState(false);

    const handleClose = () => {
      resetForm();
      setFilesPreview(null);
      setConnectionChecked(false);
      setType("s3");
      onClose();
      modal?.hide();
    };

    // Initialize providers first
    useEffect(() => {
      Object.entries(providers).forEach(([name, config]) => {
        addProvider(name, config);
      });
    }, [providers]);

    // Determine if we're in edit mode
    const isEditMode = Boolean(storage);

    // Define steps based on edit mode
    const steps = isEditMode
      ? [
          { title: "Configure Connection", schema: getProviderSchema(type || "s3", isEditMode) },
          { title: "Import Settings & Preview" },
          { title: "Review & Confirm" },
        ]
      : [
          { title: "Select Provider", schema: step1Schema },
          { title: "Configure Connection", schema: getProviderSchema(type || "s3", isEditMode) },
          { title: "Import Settings & Preview" },
          { title: "Review & Confirm" },
        ];

    // Initialize form state management
    const {
      formState,
      setFormState,
      errors,
      validateEntireForm,
      handleProviderFieldChange,
      handleFieldBlur,
      setCurrentStep,
      resetForm,
    } = useStorageForm({
      project,
      isEditMode,
      steps,
      storage,
    });

    const { currentStep, formData } = formState;

    // Handle modal hide (including Escape key)
    useEffect(() => {
      if (onHide) {
        const handleModalHide = () => {
          resetForm();
          setFilesPreview(null);
          setConnectionChecked(false);
          setType("s3");
          onHide();
        };

        // Call onHide immediately to set up the handler
        handleModalHide();
      }
    }, [onHide, resetForm]);

    // Initialize API hooks
    const { testConnectionMutation, createStorageMutation, loadFilesPreviewMutation, action } = useStorageApi({
      target,
      storage,
      project,
      onSubmit,
      onClose: () => {
        resetForm();
        setFilesPreview(null);
        setConnectionChecked(false);
        setType("s3");
        onClose();
        modal?.hide();
      },
    });

    // Handle provider selection
    const handleSelectChange = (name: string, value: string) => {
      setType(value);
      handleProviderFieldChange(name, value, () => {
        setFilesPreview(null);
        setConnectionChecked(false);
      });
    };

    // Handle form navigation
    const handleStepClick = (stepIndex: number) => {
      if (isEditMode || stepIndex <= currentStep) {
        setCurrentStep(stepIndex);
      }
    };

    const nextStep = () => {
      if (validateEntireForm()) {
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          createStorageMutation.mutate(formData);
        }
      }
    };

    const prevStep = () => {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    };

    // Handle API operations
    const testStorageConnection = async () => {
      if (!validateEntireForm()) return;
      console.log("validation successful");
      testConnectionMutation.mutate(formData, {
        onSuccess: (response) => {
          const isSuccess = response?.$meta?.ok || response?.$meta?.status === 200;
          setConnectionChecked(isSuccess);
        },
        onError: () => {
          setConnectionChecked(false);
        },
      });
    };

    const loadFilesPreview = async () => {
      if (!validateEntireForm()) return;
      loadFilesPreviewMutation.mutate(formData, {
        onSuccess: (response) => {
          if (response?.files) {
            setFilesPreview(response.files);
          }
        },
        onError: () => {
          setFilesPreview(null);
        },
      });
    };

    // Format file size helper
    const formatSize = (bytes: number) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
    };

    return (
      <div className="flex flex-col h-full w-full">
        <FormHeader title={title} onClose={handleClose} />

        <Stepper steps={steps} currentStep={currentStep} onStepClick={handleStepClick} isEditMode={isEditMode} />

        <div className="max-h-[60vh] overflow-y-auto px-wide py-base">
          {(() => {
            const actualStep = isEditMode ? currentStep + 1 : currentStep;

            switch (actualStep) {
              case 0:
                return (
                  <ProviderSelectionStep
                    formData={formData}
                    errors={errors}
                    handleSelectChange={handleSelectChange}
                    setFormState={setFormState}
                    providers={providers}
                    target={target}
                  />
                );
              case 1:
                return (
                  <ProviderDetailsStep
                    formData={formData}
                    errors={errors}
                    handleProviderFieldChange={(name: string, value: any) => {
                      handleProviderFieldChange(name, value, () => {
                        setFilesPreview(null);
                        setConnectionChecked(false);
                      });
                    }}
                    handleFieldBlur={handleFieldBlur}
                    provider={formData.provider || "s3"}
                    isEditMode={isEditMode}
                  />
                );
              case 2:
                return (
                  <PreviewStep
                    formData={formData}
                    formState={formState}
                    setFormState={setFormState}
                    handleChange={(e) => {
                      const { name, value } = e.target as HTMLInputElement;
                      handleProviderFieldChange(name, value);

                      // Reset validation state when import settings change
                      const importSettingsFields = [
                        "prefix",
                        "path",
                        "regex_filter",
                        "use_blob_urls",
                        "recursive_scan",
                      ];
                      if (importSettingsFields.includes(name)) {
                        setFilesPreview(null);
                        setConnectionChecked(false);
                      }
                    }}
                    action={action}
                    target={target!}
                    type={type!}
                    project={project}
                    storage={storage}
                    onSubmit={onSubmit}
                    formRef={ref}
                    filesPreview={filesPreview}
                    formatSize={formatSize}
                    onImportSettingsChange={() => {
                      setFilesPreview(null);
                      setConnectionChecked(false);
                    }}
                  />
                );
              case 3:
                return <ReviewStep formData={formData} filesPreview={filesPreview} formatSize={formatSize} />;
              default:
                return null;
            }
          })()}
        </div>

        <FormFooter
          currentStep={currentStep}
          totalSteps={steps.length}
          onPrevious={prevStep}
          onNext={nextStep}
          isEditMode={isEditMode}
          connectionChecked={connectionChecked}
          filesPreview={filesPreview}
          testConnection={{
            isLoading: testConnectionMutation.isLoading,
            mutate: testStorageConnection,
          }}
          loadPreview={{
            isLoading: loadFilesPreviewMutation.isLoading,
            mutate: loadFilesPreview,
          }}
          createStorage={{
            isLoading: createStorageMutation.isLoading,
          }}
        />
      </div>
    );
  },
);
