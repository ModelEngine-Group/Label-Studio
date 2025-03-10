import { inject, observer } from "mobx-react";
import { Space } from "../../common/Space/Space";
import { Block, Elem } from "../../utils/bem";
import { AnnotationHistory } from "./AnnotationHistory.tsx";
import { useRegionsCopyPaste } from "../../hooks/useRegionsCopyPaste";
import "./CurrentEntity.scss";

const injector = inject("store");

export const CurrentEntity = injector(
  observer(({ entity, showHistory = true }) => {
    useRegionsCopyPaste(entity);

    return entity ? (
      <Block name="annotation" onClick={(e) => e.stopPropagation()}>
        {showHistory && (
          <Elem tag={Space} spread name="title">
            Annotation History
            <Elem name="id">#{entity.pk ?? entity.id}</Elem>
          </Elem>
        )}
        <AnnotationHistory enabled={showHistory} />
      </Block>
    ) : null;
  }),
);
