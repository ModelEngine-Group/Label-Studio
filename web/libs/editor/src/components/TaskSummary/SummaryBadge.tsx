import type { PropsWithChildren } from "react";

export const SummaryBadge = ({ children }: PropsWithChildren) => {
  const className = [
    "inline-flex items-center rounded-4 border px-tighter py-tightest",
    "text-xs font-semibold transition-colors",
    "bg-primary-background border-primary-emphasis text-accent-grape-dark",
  ].join(" ");
  return <div className={className}>{children}</div>;
};
