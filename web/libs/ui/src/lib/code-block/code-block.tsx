export function CodeBlock({
  code,
}: {
  title?: string;
  description?: string;
  code: string;
  className?: string;
}) {
  return <div className="whitespace-pre-wrap font-mono mt-2 p-3 bg-gray-100 rounded-sm max-h-fit">{code.trim()}</div>;
}
