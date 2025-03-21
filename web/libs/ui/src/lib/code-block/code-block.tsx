import { SimpleCard } from "../simple-card";

export function CodeBlock({
  code,
  title,
  description,
  className,
}: {
  title?: string;
  description?: string;
  code: string;
  className?: string;
}) {
  return (
    <SimpleCard title={title} description={description} className={className}>
      <div className="whitespace-pre-wrap font-mono mt-2 p-3 bg-gray-100 rounded-sm max-h-fit">{code.trim()}</div>
    </SimpleCard>
  );
}
