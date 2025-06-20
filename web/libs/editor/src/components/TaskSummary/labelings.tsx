import { cnm } from "@humansignal/ui";
import type { RawResult } from "../../stores/types";
import type { RendererType } from "./types";
import { getLabelCounts } from "./utils";

const resultValue = (result: RawResult) => {
  if (result.type === "textarea") {
    return result.value.text;
  }

  return result.value[result.type];
};

const LabelsRenderer: RendererType = (results, control) => {
  const labels = results.flatMap(resultValue).flat();

  if (!labels.length) return "-";

  const labelCounts = getLabelCounts(labels, control.label_attrs);

  return (
    <span className="flex gap-2 flex-wrap">
      {Object.entries(labelCounts)
        .filter(([_, data]) => data.count > 0)
        .map(([label, data]) => {
          return (
            <span
              className="inline-block px-2 whitespace-nowrap rounded-4"
              style={{
                borderLeft: `4px solid ${data.border}`,
                color: data.color,
                background: data.background,
              }}
            >
              <b>{data.count}</b> {label}
            </span>
          );
        })}
    </span>
  );
};

export const renderers: Record<string, RendererType> = {
  labels: LabelsRenderer,
  ellipselabels: LabelsRenderer,
  polygonlabels: LabelsRenderer,
  rectanglelabels: LabelsRenderer,
  keypointlabels: LabelsRenderer,
  brushlabels: LabelsRenderer,
  hypertextlabels: LabelsRenderer,
  timeserieslabels: LabelsRenderer,
  paragraphlabels: LabelsRenderer,
  timelinelabels: LabelsRenderer,
  number: (results) => {
    if (!results.length) return "-";

    return resultValue(results[0]);
  },
  choices: (results) => {
    const choices = results.flatMap(resultValue).flat();
    const unique = [...new Set(choices)];

    if (!choices.length) return null;

    return (
      <span className="flex gap-2 flex-wrap">
        {unique.map((choice) => (
          <span
            key={choice}
            className={cnm(
              "inline-block whitespace-nowrap rounded-4 px-2",
              "bg-primary-background border border-primary-emphasis text-accent-grape-dark",
            )}
          >
            {choice}
          </span>
        ))}
      </span>
    );
  },
  textarea: (results, control) => {
    if (!results.length) return "-";
    if (control.per_region) return null;

    const value = resultValue(results[0]);

    if (!value) return null;

    return <span className="text-ellipsis line-clamp-6">{value}</span>;
  },
  rating: (results, control) => {
    if (!results.length) return "-";
    if (control.per_region) return null;

    const value = resultValue(results[0]);

    if (!value) return null;

    return "★".repeat(value);
  },
};
