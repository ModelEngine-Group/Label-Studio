import { SummaryBadge } from "./SummaryBadge";
import type { ObjectTypes } from "./types";

type DataSummaryProps = {
  data_types: ObjectTypes;
  data: Record<string, any>;
};

export const DataSummary = ({ data_types, data }: DataSummaryProps) => {
  return (
    <table className="table-auto w-full">
      <thead>
        <tr>
          {Object.entries(data_types).map(([field, { type }]) => (
            <th key={field} className="px-4 py-2 text-left whitespace-nowrap">
              {field} <SummaryBadge>{type}</SummaryBadge>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {Object.entries(data_types).map(([field, { value }]) => (
            <td key={field} className="px-4 py-2 align-top">
              {typeof value === "object" ? JSON.stringify(value) : value}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
};
