import type React from "react";
import { FieldRenderer } from "./field-renderer";
import { type ProviderConfig, getFieldsForRow } from "../types/provider";

interface ProviderFormProps {
  provider: ProviderConfig;
  formData: Record<string, any>;
  errors: Record<string, string>;
  onChange: (name: string, value: any) => void;
  onBlur?: (name: string, value: any) => void;
  isEditMode?: boolean;
}

export const ProviderForm: React.FC<ProviderFormProps> = ({
  provider,
  formData,
  errors,
  onChange,
  onBlur,
  isEditMode = false,
}) => {
  return (
    <div className="space-y-6">
      {provider.layout.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${row.fields.length}, 1fr)`,
          }}
        >
          {getFieldsForRow(provider.fields, row.fields).map((field) => (
            <div
              key={field.name}
              style={{
                gridColumn: field.gridCols ?? "initial",
              }}
            >
              {field.type === "message" ? (
                <div>{field.content}</div>
              ) : (
                <FieldRenderer
                  field={field}
                  value={formData[field.name]}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors[field.name]}
                  isEditMode={isEditMode}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
