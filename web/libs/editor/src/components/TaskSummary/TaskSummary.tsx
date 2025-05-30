import type { MSTAnnotation, MSTControlTag, MSTStore } from "../../stores/types";
import { DataSummary } from "./DataSummary";
import { LabelingSummary } from "./LabelingSummary";
import { NumbersSummary } from "./NumbersSummary";
import type { ControlTag, LabelAttrs, ObjectTagEntry, ObjectTypes } from "./types";

type TaskSummaryProps = {
  annotations: MSTAnnotation[];
  store: MSTStore["annotationStore"];
};

const TaskSummary = ({ annotations: all, store: annotationStore }: TaskSummaryProps) => {
  const task = annotationStore.store.task;
  const data = task.dataObj;
  // skip unsubmitted drafts
  const annotations = all.filter((a) => a.pk);
  const allTags = [...annotationStore.names];

  const controlTags: [string, MSTControlTag][] = allTags.filter(([_, control]) => control.isControlTag) as [
    string,
    MSTControlTag,
  ][];
  const controls: ControlTag[] = controlTags.map(([name, control]) => ({
    name,
    type: control.type,
    to_name: control.toname,
    label_attrs:
      control.children?.reduce(
        (acc, { value, background }) => {
          acc[value] = { value, background };
          return acc;
        },
        {} as Record<string, LabelAttrs>,
      ) ?? {},
    per_region: !!control.perregion,
  }));

  const objectTags: ObjectTagEntry[] = allTags.filter(
    ([_, tag]) => tag.isObjectTag && tag.value.includes("$"),
  ) as ObjectTagEntry[];
  const dataTypes: ObjectTypes = Object.fromEntries(
    objectTags.map(([name, object]) => [
      name,
      // images use `parsedValue` instead of `_value`
      { type: object.type, value: "parsedValue" in object ? object.parsedValue : (object._value ?? object.value) },
    ]),
  );

  const values = [
    {
      title: "Agreement",
      value: task?.agreement ? `${task.agreement.toFixed(2)}%` : "N/A",
      info: "Overall agreement over all submitted annotations",
    },
    {
      title: "Annotations",
      value: annotations.filter((a) => a.type === "annotation").length,
      info: "Number of submitted annotations",
    },
    {
      title: "Predictions",
      value: annotations.filter((a) => a.type === "prediction").length,
      info: "Number of predictions",
    },
  ];

  return (
    <div className="p-4">
      <h2 className="px-4">Review Summary</h2>
      <NumbersSummary values={values} />
      <LabelingSummary annotations={annotations} controls={controls} />
      <h2 className="px-4">Task Data</h2>
      <DataSummary data_types={dataTypes} data={data} />
    </div>
  );
};

export default TaskSummary;
