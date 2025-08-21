import { withMedia } from "../utils/media/MediaMixin";
import type { ViewWithMedia } from "../utils/media/types";

class ParagraphsHelper extends withMedia(
  class implements ViewWithMedia {
    get _baseRootSelector() {
      return ".lsf-paragraphs";
    }

    _rootSelector: string;

    constructor(rootSelector: string) {
      this._rootSelector = rootSelector.replace(/^\&/, this._baseRootSelector);
    }

    get root() {
      return cy.get(this._rootSelector);
    }

    get mediaElement() {
      return this.root.get("audio[controls]");
    }

    getPhrase(idx: number) {
      return this.root.find(`[data-testid="phrase:${idx}"]`);
    }
    getPhrasePlayButton(idx: number, timeout = 4000) {
      return this.getPhrase(idx).find("button[aria-label='play']", { timeout });
    }
    getPhrasePauseButton(idx: number, timeout = 4000) {
      return this.getPhrase(idx).find("button[aria-label='pause']", { timeout });
    }

    hasPhrasePlaying(idx: number, timeout = 4000) {
      this.getPhrasePauseButton(idx, timeout).should("exist");
    }
    hasNoPhrasePlaying(idx: number, timeout = 4000) {
      this.getPhrasePlayButton(idx, timeout).should("exist");
    }
  },
) {}

const Paragraphs = new ParagraphsHelper("&:eq(0)");
const useParagraphs = (rootSelector: string) => {
  return new ParagraphsHelper(rootSelector);
};

export { Paragraphs, useParagraphs };
