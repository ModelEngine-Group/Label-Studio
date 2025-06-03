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
    responsiveImage: view?.gridResponsiveImage,
    hasImage,
  };
});

export const GridWidthButton = injector(({ view, isGrid, gridWidth, responsiveImage, hasImage, size }) => {
  const [width, setWidth] = useState(gridWidth);

  const setGridWidth = useCallback(
    (width) => {
      const newWidth = Math.max(1, Math.min(width, 10));

      setWidth(newWidth);
      view.setGridWidth(newWidth);
    },
    [view],
  );

  const handleResponsiveImagesToggle = useCallback((e) => {
    view.setGridResponsiveImage(!e.target.checked);
  }, []);

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
              <Toggle checked={!responsiveImage} onChange={handleResponsiveImagesToggle} />
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
