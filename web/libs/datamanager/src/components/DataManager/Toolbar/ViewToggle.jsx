import { inject, observer } from "mobx-react";
import { LsGrid, LsList } from "../../../assets/icons";
import { RadioGroup } from "../../Common/RadioGroup/RadioGroup";
import { Tooltip } from "@humansignal/ui";

const viewInjector = inject(({ store }) => ({
  view: store.currentView,
}));

export const ViewToggle = viewInjector(
  observer(({ view, size, ...rest }) => {
    return (
      <RadioGroup size={size} value={view.type} onChange={(e) => view.setType(e.target.value)} {...rest}>
        <Tooltip title="List view">
          <div>
            <RadioGroup.Button value="list">
              <LsList />
            </RadioGroup.Button>
          </div>
        </Tooltip>
        <Tooltip title="Grid view">
          <div>
            <RadioGroup.Button value="grid">
              <LsGrid />
            </RadioGroup.Button>
          </div>
        </Tooltip>
      </RadioGroup>
    );
  }),
);

export const DataStoreToggle = viewInjector(({ view, size, ...rest }) => {
  return (
    <RadioGroup value={view.target} size={size} onChange={(e) => view.setTarget(e.target.value)} {...rest}>
      <RadioGroup.Button value="tasks">Tasks</RadioGroup.Button>
      <RadioGroup.Button value="annotations" disabled>
        Annotations
      </RadioGroup.Button>
    </RadioGroup>
  );
});
