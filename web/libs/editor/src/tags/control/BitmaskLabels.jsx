import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Types from "../../core/Types";
import { HtxLabels, LabelsModel } from "./Labels/Labels";
import ControlBase from "./Base";
import { BitmaskModel } from "./Bitmask";

/**
 * The `BitmaskLabels` tag for image segmentation tasks is used in the area where you want to apply a mask or use a brush to draw a region on the image.
 *
 * Bitmask operates on pixel level and outputs a png encoded in a Base64 data URL.
 *
 * Use with the following data types: image.
 * @example
 * <!--Basic image segmentation labeling configuration-->
 * <View>
 *   <BitmaskLabels name="labels" toName="image">
 *     <Label value="Person" />
 *     <Label value="Animal" />
 *   </BitmaskLabels>
 *   <Image name="image" value="$image" />
 * </View>
 * @name BitmaskLabels
 * @regions BitmaskRegion
 * @meta_title Bitmask Label Tag for Image Segmentation Labeling
 * @meta_description Customize Label Studio with brush label tags for image segmentation labeling for machine learning and data science projects.
 * @param {string} name                      - Name of the element
 * @param {string} toName                    - Name of the image to label
 * @param {single|multiple=} [choice=single] - Configure whether the data labeler can select one or multiple labels
 * @param {number} [maxUsages]               - Maximum number of times a label can be used per task
 * @param {boolean} [showInline=true]        - Show labels in the same visual line
 */

const Validation = types.model({
  controlledTags: Types.unionTag(["Image"]),
});

const ModelAttrs = types.model("BitmaskLabelsModel", {
  type: "bitmaskregion",
  children: Types.unionArray(["label", "header", "view", "hypertext"]),
});

const BitmaskLabelsModel = types.compose(
  "BitmaskLabelsModel",
  ControlBase,
  LabelsModel,
  ModelAttrs,
  BitmaskModel,
  Validation,
  LabelMixin,
  SelectedModelMixin.props({ _child: "LabelModel" }),
);

const HtxBitmaskLabels = observer(({ item }) => {
  return <HtxLabels item={item} />;
});

Registry.addTag("bitmasklabels", BitmaskLabelsModel, HtxBitmaskLabels);

export { HtxBitmaskLabels, BitmaskLabelsModel };
