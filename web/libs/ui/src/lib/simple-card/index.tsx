import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@humansignal/shad/components/ui/card";
import { cn } from "@humansignal/shad/utils";
import type { HtmlHTMLAttributes, PropsWithChildren, ReactNode } from "react";

export function SimpleCard({
  children,
  title,
  description,
  className: cls,
  ...rest
}: PropsWithChildren<
  {
    title: ReactNode;
    description?: ReactNode;
  } & Omit<HtmlHTMLAttributes<HTMLDivElement>, "title">
>) {
  const className = cn("bg-transparent", cls);
  return (
    <Card className={className} {...rest}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex justify-between font-medium">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-4 pt-0">{children}</CardContent>
    </Card>
  );
}
