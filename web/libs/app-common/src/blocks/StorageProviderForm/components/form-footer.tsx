import { Button, cnm } from "@humansignal/ui";

interface FormFooterProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  isEditMode: boolean;
  connectionChecked: boolean;
  filesPreview: any[] | null;
  testConnection: {
    isLoading: boolean;
    mutate: () => void;
  };
  loadPreview: {
    isLoading: boolean;
    mutate: () => void;
  };
  createStorage: {
    isLoading: boolean;
  };
}

export const FormFooter = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  isEditMode,
  connectionChecked,
  filesPreview,
  testConnection,
  loadPreview,
  createStorage,
}: FormFooterProps) => {
  return (
    <div className="flex items-center justify-between p-wide border-t border-neutral-border bg-neutral-background">
      <Button look="outlined" onClick={onPrevious} disabled={currentStep === 0}>
        Previous
      </Button>

      <div className="flex gap-tight items-center">
        {(isEditMode ? currentStep === 0 : currentStep === 1) && (
          <>
            <Button
              waiting={testConnection.isLoading}
              onClick={testConnection.mutate}
              variant={connectionChecked ? "positive" : "primary"}
              className={cnm({
                "border-none shadow-none bg-positive-surface-content-subtle text-positive-content pointer-events-none":
                  connectionChecked,
              })}
              style={connectionChecked ? { textShadow: "none" } : {}}
            >
              {connectionChecked ? "Connection Verified" : "Test Connection"}
            </Button>
          </>
        )}

        {(isEditMode ? currentStep === 1 : currentStep === 2) && (
          <Button waiting={loadPreview.isLoading} onClick={loadPreview.mutate} disabled={filesPreview !== null}>
            {filesPreview !== null ? "✓ Preview Loaded" : "Load Preview"}
          </Button>
        )}

        <Button
          onClick={onNext}
          waiting={currentStep === totalSteps - 1 && createStorage.isLoading}
          disabled={!isEditMode && currentStep === 1 && !connectionChecked}
        >
          {currentStep < totalSteps - 1 ? "Next" : "Submit"}
        </Button>
      </div>
    </div>
  );
};
