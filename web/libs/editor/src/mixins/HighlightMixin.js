import { types } from "mobx-state-tree";

import Utils from "../utils";
import { defaultStyle } from "../core/Constants";
import { isDefined } from "../utils/utilities";

const HIGHLIGHT_CN = "htx-highlight";
const HIGHLIGHT_NO_LABEL_CN = "htx-no-label";
const LABEL_COLOR_ALPHA = 0.3;

export const HighlightMixin = types
  .model()
  .views((self) => ({
    get _hasSpans() {
      // @todo is it possible that only some spans are connected?
      // @TODO: Need to check if it is still necessary condition. The way of working with spans was changed and it could affect this part. The main question, is there still a way to get `isConnected === false`
      return self._spans ? self._spans.every((span) => span.isConnected) : false;
    },
    get identifier() {
      return `${self.id.split("#")[0]}-${self.ouid}`;
    },
    get className() {
      return `${HIGHLIGHT_CN}-${self.identifier}`;
    },
    get classNames() {
      const classNames = [HIGHLIGHT_CN, self.className];

      if (!(self.parent.showlabels ?? self.store.settings.showLabels)) {
        classNames.push(HIGHLIGHT_NO_LABEL_CN);
      }

      // in this case labels presence can't be changed from settings — manual mode
      if (isDefined(self.parent.showlabels)) {
        classNames.push("htx-manual-label");
      }

      return classNames;
    },
    get styles() {
      const { className } = self;
      const activeColorOpacity = 0.8;
      const color = self.getLabelColor();
      const initialActiveColor = Utils.Colors.rgbaChangeAlpha(color, activeColorOpacity);

      return `
        .${className} {
          background-color: ${color} !important;
          border: 1px dashed transparent;
        }
        .${className}.${STATE_CLASS_MODS.active}:not(.${STATE_CLASS_MODS.hidden}) {
          color: ${Utils.Colors.contrastColor(initialActiveColor)} !important;
          background-color: ${initialActiveColor} !important;
        }
      `;
    },
  }))
  .actions((self) => ({
    /**
     * Create highlights from the stored `Range`
     */
    applyHighlight(init = false) {
      // skip re-initialization
      if (self._hasSpans) {
        return void 0;
      }

      self._spans = self.parent.createSpansByGlobalOffsets(self.globalOffsets);
      self._spans?.forEach((span) => (span.className = self.classNames.join(" ")));
      self.updateSpans();
      if (!init) {
        self.parent.setStyles({ [self.identifier]: self.styles });
      }
      return void 0;
    },

    updateHighlightedText() {
      if (!self.text) {
        self.text = self.parent.getTextFromGlobalOffsets(self.globalOffsets);
      }
    },

    updateSpans() {
      // @TODO: Is `_hasSpans` some artifact from the old version?
      if (self._hasSpans || self._spans?.length) {
        const lastSpan = self._spans[self._spans.length - 1];

        // @TODO: Should we manage it in domManager?
        Utils.Selection.applySpanStyles(lastSpan, { index: self.region_index, label: self.getLabels() });
      }
    },

    clearSpans() {
      self._spans = null;
    },

    /**
     * Removes current highlights
     */
    removeHighlight() {
      if (self.globalOffsets) {
        self.parent?.removeSpansInGlobalOffsets(self._spans, self.globalOffsets);
      }
      self.parent?.removeStyles([self.identifier]);
    },

    /**
     * Update region's appearance if the label was changed
     */
    updateAppearenceFromState() {
      if (!self._spans?.length) {
        return;
      }

      const lastSpan = self._spans[self._spans.length - 1];

      self.parent.setStyles?.({ [self.identifier]: self.styles });
      Utils.Selection.applySpanStyles(lastSpan, { index: self.region_index, label: self.getLabels() });
    },

    /**
     * Make current region selected
     */
    selectRegion() {
      self.annotation.setHighlightedNode(self);

      self.addClass(STATE_CLASS_MODS.active);

      const first = self._spans?.[0];

      if (!first) {
        return;
      }

      if (first.scrollIntoViewIfNeeded) {
        first.scrollIntoViewIfNeeded();
      } else {
        first.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    },

    /**
     * Unselect text region
     */
    afterUnselectRegion() {
      self.removeClass(STATE_CLASS_MODS.active);
    },

    /**
     * Remove stylesheet before removing the highlight itself
     */
    beforeDestroy() {
      self.parent?.removeStyles([self.identifier]);
    },

    /**
     * Draw region outline
     * @param {boolean} val
     */
    setHighlight(val) {
      if (!self._spans) {
        return;
      }

      self._highlighted = val;

      if (self.highlighted) {
        self.addClass(STATE_CLASS_MODS.highlighted);
      } else {
        self.removeClass(STATE_CLASS_MODS.highlighted);
      }
    },

    getLabels() {
      const index = self.region_index;
      const text = (self.labeling?.selectedLabels ?? []).map((label) => label.value).join(",");

      return [index, text].filter(Boolean).join(":");
    },

    getLabelColor() {
      const labelColor = self.parent.highlightcolor || (self.style || self.tag || defaultStyle).fillcolor;

      return Utils.Colors.convertToRGBA(labelColor ?? "#DA935D", LABEL_COLOR_ALPHA);
    },

    find(span) {
      return self._spans && self._spans.indexOf(span) >= 0 ? self : undefined;
    },

    /**
     * Add classes to all spans
     * @param {string[]} classNames
     */
    addClass(classNames) {
      if (!classNames || !self._spans) {
        return;
      }
      const classList = [].concat(classNames); // convert any input to array

      self._spans.forEach((span) => span.classList.add(...classList));
    },

    /**
     * Remove classes from all spans
     * @param {string[]} classNames
     */
    removeClass(classNames) {
      if (!classNames || !self._spans) {
        return;
      }
      const classList = [].concat(classNames); // convert any input to array

      self._spans.forEach((span) => span.classList.remove(...classList));
    },

    toggleHidden(e) {
      self.hidden = !self.hidden;
      if (self.hidden) {
        self.addClass("__hidden");
      } else {
        self.removeClass("__hidden");
      }

      e?.stopPropagation();
    },
  }));

export const STATE_CLASS_MODS = {
  active: "__active",
  highlighted: "__highlighted",
  collapsed: "__collapsed",
  hidden: "__hidden",
  noLabel: HIGHLIGHT_NO_LABEL_CN,
};
