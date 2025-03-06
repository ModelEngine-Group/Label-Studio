import type { HtmlHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../shad/utils";

export function Sub({ children, className: cls, ...rest }: PropsWithChildren<HtmlHTMLAttributes<HTMLElement>>) {
  const className = cn("text-sm text-lsSubtitle align-baseline", cls);
  return (
    <sub className={className} {...rest}>
      {children}
    </sub>
  );
}
