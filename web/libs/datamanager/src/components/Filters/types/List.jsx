import { observer } from "mobx-react";
import { FilterDropdown } from "../FilterDropdown";
// import { Common } from "./Common";

export const VariantSelect = observer(({ filter, schema, onChange, multiple, value, placeholder }) => {
  if (!schema) return <></>;
  const { items } = schema;

  const selectedValue = (() => {
    if (!multiple) {
      return Array.isArray(value) ? value[0] : value;
    }
    return Array.isArray(value) ? value : (value ?? []);
  })();

  const FilterItem = filter.cellView?.FilterItem;
  return (
    <FilterDropdown
      items={items?.toJSON ? items.toJSON() : items}
      value={selectedValue}
      multiple={multiple}
      optionRender={FilterItem}
      outputFormat={
        multiple
          ? (value) => {
              return value ? [].concat(value) : [];
            }
          : undefined
      }
      searchFilter={filter.cellView?.searchFilter}
      onChange={(value) => onChange(value)}
      placeholder={placeholder ?? "Select value"}
    />
  );
});

export const ListFilter = [
  {
    key: "contains",
    label: "contains",
    valueType: "single",
    input: (props) => <VariantSelect {...props} multiple />,
  },
  {
    key: "not_contains",
    label: "not contains",
    valueType: "single",
    input: (props) => <VariantSelect {...props} multiple />,
  },
  // ... Common,
];
