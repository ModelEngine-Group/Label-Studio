import type { ReactNode } from "react";

// Type definitions
interface KeyboardKeyProps {
  children: ReactNode;
}

/**
 * KeyboardKey component for displaying keyboard shortcuts in a styled kbd element
 *
 * @param {KeyboardKeyProps} props - The component props
 * @returns {React.ReactElement} The KeyboardKey component
 */
export const KeyboardKey = ({ children }: KeyboardKeyProps) => {
  return (
    <kbd className="inline-flex items-center justify-center rounded border border-input bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground font-sans">
      {children}
    </kbd>
  );
};
