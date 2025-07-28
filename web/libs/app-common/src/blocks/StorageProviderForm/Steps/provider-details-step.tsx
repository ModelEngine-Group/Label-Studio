import { getProviderConfig } from "../providers";
import { ProviderForm } from "../components/provider-form";
import Input from "apps/labelstudio/src/components/Form/Elements/Input/Input";
import { InlineError } from "apps/labelstudio/src/components/Error/InlineError";

interface ProviderDetailsStepProps {
  formData: any;
  errors: Record<string, string>;
  handleProviderFieldChange: (name: string, value: any) => void;
  handleFieldBlur?: (name: string, value: any) => void;
  provider?: string;
  isEditMode?: boolean;
}

export const ProviderDetailsStep = ({
  formData,
  errors,
  handleProviderFieldChange,
  handleFieldBlur,
  provider,
  isEditMode = false,
}: ProviderDetailsStepProps) => {
  const providerConfig = getProviderConfig(provider);

  if (!provider || !providerConfig) {
    return <div className="text-red-500">{!provider ? "No provider selected" : `Unknown provider: ${provider}`}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{providerConfig.title}</h2>
        <p className="text-muted-foreground">{providerConfig.description}</p>
      </div>

      {/* Title field - common for all providers */}
      <div className="space-y-2">
        <Input
          name="title"
          value={formData.title ?? ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleProviderFieldChange("title", e.target.value)}
          placeholder="Enter a descriptive name (e.g., 'Legal Documents', 'Training Data')"
          validate=""
          skip={false}
          labelProps={{}}
          ghost={false}
          tooltip=""
          tooltipIcon={null}
          required={true}
          label="Storage Title"
          description="This name will help you identify this connection in your project"
          footer={errors.title ? <span className="text-negative-content">{errors.title}</span> : ""}
          className={errors.title ? "border-negative-content" : ""}
        />
      </div>

      <ProviderForm
        provider={providerConfig}
        formData={formData}
        errors={errors}
        onChange={handleProviderFieldChange}
        onBlur={handleFieldBlur}
        isEditMode={isEditMode}
      />

      <InlineError includeValidation />
    </div>
  );
};
