import type React from "react";
import { Label, Toggle, Select } from "@humansignal/ui";
import Counter from "apps/labelstudio/src/components/Form/Elements/Counter/Counter";
import Input from "apps/labelstudio/src/components/Form/Elements/Input/Input";
import type { FieldDefinition } from "../types/common";
import { isFieldRequired } from "../types/provider";

interface FieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange: (name: string, value: any) => void;
  onBlur?: (name: string, value: any) => void;
  error?: string;
  isEditMode?: boolean;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  isEditMode = false,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value: inputValue, type } = e.target;
    const parsedValue = type === "number" ? Number(inputValue) : inputValue;
    onChange(name, parsedValue);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onBlur) {
      const { name, value: inputValue, type } = e.target;
      const parsedValue = type === "number" ? Number(inputValue) : inputValue;
      onBlur(name, parsedValue);
    }
  };

  const handleToggleChange = (checked: boolean) => {
    onChange(field.name, checked);
  };

  const handleSelectChange = (value: string) => {
    onChange(field.name, value);
  };

  const handleCounterChange = (e: any) => {
    onChange(field.name, Number(e.target.value));
  };

  // Common props for Input component
  const getInputProps = () => ({
    validate: "",
    skip: false,
    labelProps: {},
    ghost: false,
    tooltip: "",
    tooltipIcon: null,
    required: isFieldRequired(field, isEditMode),
    label: field.label,
    description: field.description || "",
    footer: error ? <div className="text-negative-content">{error}</div> : "",
    className: error ? "border-negative-content" : "",
    placeholder: field.placeholder,
    autoComplete: field.autoComplete,
  });

  // Enhanced description for access key fields in edit mode
  const getEnhancedDescription = () => {
    return field.description || "";
  };

  switch (field.type) {
    case "text":
    case "password":
      return (
        <Input
          name={field.name}
          type={field.type}
          value={value || ""}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          {...getInputProps()}
          description={getEnhancedDescription()}
        />
      );

    case "number":
      return (
        <Input
          name={field.name}
          type="number"
          value={value !== undefined && value !== null ? value : ""}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          min={field.min}
          max={field.max}
          step={field.step}
          {...getInputProps()}
        />
      );

    case "textarea":
      return (
        <Input
          name={field.name}
          value={value || ""}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          {...getInputProps()}
          description={getEnhancedDescription()}
        />
      );

    case "select":
      return (
        <div className="space-y-2">
          <Label text={field.label} description={field.description} />
          <Select
            name={field.name}
            value={value ?? ""}
            onChange={(selectedValue) => handleSelectChange(selectedValue)}
            options={field.options || []}
            placeholder={field.placeholder}
          />
          {error && <p className="text-sm text-negative-content">{error}</p>}
        </div>
      );

    case "toggle":
      return (
        <div className="flex items-start space-x-4">
          <Toggle
            checked={value || false}
            onChange={(e) => handleToggleChange(e.target.checked)}
            aria-label={field.label}
            label={field.label}
            description={field.description}
          />
        </div>
      );

    case "counter": {
      const counterValue = value !== undefined && value !== null ? value : field.min || 0;
      return (
        <Counter
          name={field.name}
          label={field.label}
          value={counterValue}
          min={field.min || 0}
          max={field.max || 100}
          step={field.step || 1}
          onChange={handleCounterChange}
          className=""
          validate=""
          required={isFieldRequired(field, isEditMode)}
          skip={false}
          labelProps={{}}
        />
      );
    }

    default:
      return <div className="text-red-500">Unknown field type: {field.type}</div>;
  }
};
