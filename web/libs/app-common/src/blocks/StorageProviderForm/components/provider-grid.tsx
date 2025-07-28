import { cn } from "@humansignal/ui";
import type { ProviderConfig } from "../types/provider";

interface Provider {
  name: string;
  title: string;
}

interface ProviderGridProps {
  providers: ProviderConfig[];
  selectedProvider?: string;
  onProviderSelect: (providerName: string) => void;
  error?: string;
}

export const ProviderGrid = ({ providers, selectedProvider, onProviderSelect, error }: ProviderGridProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-tight">
        {Object.entries(providers).map(([_, provider]) => {
          const isSelected = selectedProvider === provider.name;
          const Icon = provider.icon;

          return (
            <button
              key={provider.name}
              type="button"
              onClick={() => onProviderSelect(provider.name)}
              className={cn(
                "relative p-base border-2 rounded-lg transition-all duration-200 text-center",
                "hover:border-primary-border hover:bg-primary-emphasis-subtle",
                "focus:outline-none focus:ring-2 focus:ring-primary-focus-outline focus:ring-offset-2",
                "flex flex-col items-center gap-2",
                isSelected
                  ? "border-primary-border bg-primary-emphasis-subtle shadow-sm"
                  : "border-neutral-border hover:border-primary-border-subtle",
              )}
              aria-pressed={isSelected}
            >
              {Icon && <Icon className="w-8 h-8" />}
              <div className="flex-1 min-w-0">
                <h3 className="text-body-medium text-neutral-content truncate whitespace-pre">{provider.title}</h3>
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="text-body-small text-negative-content">{error}</p>}
    </div>
  );
};
