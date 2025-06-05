import { inject } from "mobx-react";
import { useCallback, useState } from "react";
import { Button } from "../../Common/Button/Button";
import { Dropdown } from "../../Common/Dropdown/DropdownComponent";
import { Toggle } from "../../Common/Form";
import { IconSettings, IconMinus, IconPlus } from "@humansignal/icons";

const injector = inject(({ store }) => {
  const view = store?.currentView;

  const cols = view.fieldsAsColumns ?? [];
  const hasImage = cols.some(({ type }) => type === "Image") ?? false;

  return {
    view,
    isGrid: view.type === "grid",
    gridWidth: view?.gridWidth,
    fitImagesToWidth: view?.gridFitImagesToWidth,
    hasImage,
  };
});

export const GridWidthButton = injector(({ view, isGrid, gridWidth, fitImagesToWidth, hasImage, size }) => {
  const [width, setWidth] = useState(gridWidth);

  const setGridWidth = useCallback(
    (width) => {
      const newWidth = Math.max(1, Math.min(width, 10));

      setWidth(newWidth);
      view.setGridWidth(newWidth);
    },
    [view],
  );

  const handleFitImagesToWidthToggle = useCallback(
    (e) => {
      view.setFitImagesToWidth(e.target.checked);
    },
    [view],
  );

  return isGrid ? (
    <Dropdown.Trigger
      content={
        <div className="p-tight min-w-wide space-y-base">
          <div className="grid grid-cols-[1fr_min-content] gap-base items-center">
            <span>Columns: {width}</span>
            <Button.Group>
              <Button
                onClick={() => setGridWidth(width - 1)}
                disabled={width === 1}
                rawClassName="aspect-square h-6 !p-0"
              >
                <IconMinus />
              </Button>
              <Button
                onClick={() => setGridWidth(width + 1)}
                disabled={width === 10}
                rawClassName="aspect-square h-6 !p-0"
              >
                <IconPlus />
              </Button>
            </Button.Group>
          </div>
          {hasImage && (
            <div className="grid grid-cols-[1fr_min-content] gap-base items-center">
              <span>Fit images to width</span>
              <Toggle checked={fitImagesToWidth} onChange={handleFitImagesToWidthToggle} />
            </div>
          )}
        </div>
      }
    >
      <Button size={size}>
        <IconSettings />
      </Button>
    </Dropdown.Trigger>
  ) : null;
});
