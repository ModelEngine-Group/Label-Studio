import type { ReactNode } from "react";
import type { RawResult } from "../../stores/types";
import { contrastColor, convertToRGBA } from "../../utils/colors";
import type { ControlTag } from "./types";

type RendererType = (results: RawResult[], control: ControlTag) => ReactNode;

const resultValue = (result: RawResult) => {
  if (result.type === "textarea") {
    return result.value.text;
  }

  return result.value[result.type];
};

const LabelsRenderer: RendererType = (results, control) => {
  const labels = results.flatMap(resultValue).flat();
  const labelAmounts: [string, number][] = Object.entries(
    labels.reduce((acc, label) => {
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {}),
  );
  const labelColors = Object.fromEntries(
    Object.entries(control.label_attrs).map(([lbl, attr]) => [lbl, attr.background]),
  );

  if (!labels.length) return "-";

  return (
    <span className="flex gap-2">
      {labelAmounts.map(([label, amount]) => {
        const color = labelColors[label];
        const background = color ? convertToRGBA(color, 0.3) : undefined;

        return (
          <span
            className="inline-block px-2 whitespace-nowrap rounded-4"
            style={{
              borderLeft: `4px solid ${color ?? "var(--color-grape-200)"}`,
              color: background ? contrastColor(background) : undefined,
              background: background ?? "var(--color-grape-200)",
            }}
          >
            <b>{amount}</b> {label}
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
  number: (results, control) => {
    if (!results.length) return "-";

    return resultValue(results[0]);
  },
  choices: (results, control) => {
    const choices = results.flatMap(resultValue).flat();
    const unique = [...new Set(choices)];

    if (!choices.length) return null;

    return (
      <span className="flex gap-2">
        {unique.map((choice) => (
          <span
            key={choice}
            className="inline-block px-2 bg-primary-background border border-primary-emphasis text-accent-grape-dark whitespace-nowrap rounded-4 mr-2"
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

    return resultValue(results[0]);
  },
};
