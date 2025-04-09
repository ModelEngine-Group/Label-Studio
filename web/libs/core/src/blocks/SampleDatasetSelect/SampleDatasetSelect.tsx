import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@humansignal/shad/components/ui/select";
import { useCallback, useMemo } from "react";

type Sample = {
  title: string;
  url: string;
  description: string;
};

export function SampleDatasetSelect({
  samples,
  sample,
  onSampleApplied,
}: {
  samples: Sample[];
  sample?: Sample;
  onSampleApplied: (sample?: Sample) => void;
}) {
  const title = useMemo(() => {
    return sample?.title ?? "Select sample";
  }, [sample]);

  const onSelect = useCallback(
    (value: string) => {
      onSampleApplied(samples.find((s) => s.url === value));
    },
    [samples, onSampleApplied],
  );

  return (
    <div className="flex gap-3 items-center">
      <span className="text-neutral-content-subtler">or use a sample dataset</span>
      <Select value={sample?.url ?? null} onValueChange={onSelect}>
        <SelectTrigger className="!h-10 min-w-52 rounded-sm border-neutral-border-bold data-[placeholder]:!text-[#000] data-[placeholder]:text-[16px] text-[16px] [&_svg]:stroke-[#000]">
          {title}
        </SelectTrigger>
        <SelectContent className="z-99999 w-fit min-w-[400px] p-2">
          <SelectGroup>
            {samples.map((sample) => (
              <SelectItem value={sample.url} key={sample.url} className="hover:bg-neutral-surface-active">
                <div className=" font-bold">{sample.title}</div>
                <div className="mt-2">{sample.description}</div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
