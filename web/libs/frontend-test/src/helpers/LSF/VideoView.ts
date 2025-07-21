import TriggerOptions = Cypress.TriggerOptions;
import ObjectLike = Cypress.ObjectLike;
import ClickOptions = Cypress.ClickOptions;
import { SINGLE_FRAME_TIMEOUT } from "../../../../editor/tests/integration/e2e/utils/constants";

type MouseInteractionOptions = Partial<TriggerOptions & ObjectLike & MouseEvent>;

// The width of the frame item on the timeline
const FRAME_WIDTH = 16;
// The height of the area on the timeline reserved to interactions
const FRAME_RESERVED_HEIGHT = 24;

export const VideoView = {
  get root() {
    cy.log("Get VideoView's root");
    return cy.get(".lsf-video-segmentation");
  },
  get drawingArea() {
    cy.log("Get VideoView's drawing area");
    return this.root.get(".konvajs-content");
  },
  get videoCanvas() {
    return this.root.get(".lsf-video-canvas");
  },
  get timelineContainer() {
    return this.root.get(".lsf-video-segmentation__timeline");
  },
  get timelineToolbar() {
    return this.root.get(".lsf-timeline__topbar");
  },
  get frameCounter() {
    return this.timelineToolbar.get(".lsf-frames-control");
  },
  get frameCounterInput() {
    return this.frameCounter.get("input[type='text']");
  },
  get timeLineLabels() {
    return this.root.get(".lsf-timeline-frames__labels-bg");
  },
  get timeframesArea() {
    return this.root.get(".lsf-timeline-frames__scroll");
  },
  get configButton() {
    return this.timelineToolbar.get('[aria-label="Video settings"]');
  },

  get configModal() {
    return this.timelineToolbar.get(".lsf-video-config__modal");
  },

  get loopTimelineRegionToggle() {
    return this.configModal.find(".lsf-video-config__toggle").find("label");
  },

  get loopTimelineRegionCheckbox() {
    return this.configModal.find('.lsf-video-config__toggle input[type="checkbox"]');
  },

  get playButton() {
    return cy.get('[data-testid="playback-button:play"]');
  },

  get pauseButton() {
    return cy.get('[data-testid="playback-button:pause"]');
  },
  /**
   * Clicks at the coordinates on the drawing area
   * @param {number} x
   * @param {number} y
   */
  clickAt(x: number, y: number, options?: Partial<ClickOptions>) {
    cy.log(`Click at the image view at (${x}, ${y})`);
    this.drawingArea.scrollIntoView().click(x, y, options);
  },
  /**
   * Clicks at the relative coordinates on the drawing area
   * @param {number} x
   * @param {number} y
   */
  clickAtRelative(x: number, y: number, options?: Partial<ClickOptions>) {
    this.drawingArea.then((el) => {
      const bbox: DOMRect = el[0].getBoundingClientRect();
      const realX = x * bbox.width;
      const realY = y * bbox.height;

      this.clickAt(realX, realY, options);
    });
  },
  /**
   * Draws a rectangle on the drawing area.
   * It also could be used for some drag and drop interactions for example selecting area or moving existing regions.
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   */
  drawRect(x: number, y: number, width: number, height: number, options: MouseInteractionOptions = {}) {
    cy.log(`Draw rectangle at (${x}, ${y}) of size ${width}x${height}`);
    this.drawingArea
      .scrollIntoView()
      .trigger("mousedown", x, y, { eventConstructor: "MouseEvent", buttons: 1, ...options })
      .trigger("mousemove", x + width, y + height, { eventConstructor: "MouseEvent", buttons: 1, ...options })
      .trigger("mouseup", x + width, y + height, { eventConstructor: "MouseEvent", buttons: 1, ...options })
      // We need this while the Video tag creates new regions in useEffect hook (it means not immediately)
      // This problem could be solved in VideoRegions component of lsf
      // Without this wait we get absence of a region on screenshots
      .wait(0);
  },
  /**
   * Draws the rectangle on the drawing area with coordinates and size relative to the drawing area.
   * It also could be used for some drag and drop interactions for example selecting area or moving existing regions.
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   */
  drawRectRelative(x: number, y: number, width: number, height: number, options: MouseInteractionOptions = {}) {
    this.drawingArea.then((el) => {
      const bbox: DOMRect = el[0].getBoundingClientRect();
      const realX = x * bbox.width;
      const realY = y * bbox.height;
      const realWidth = width * bbox.width;
      const realHeight = height * bbox.height;

      this.drawRect(realX, realY, realWidth, realHeight, options);
    });
  },
  /**
   * Click at visible frame on the timeline
   */
  clickAtFrame(idx, options?: Partial<ClickOptions>) {
    cy.log(`Click at ${idx} on the timeline`);

    this.timeLineLabels.then((el) => {
      const bbox: DOMRect = el[0].getBoundingClientRect();
      const pointX = bbox.width + (idx - 0.5) * FRAME_WIDTH;
      const pointY = FRAME_RESERVED_HEIGHT / 2;

      this.timeframesArea.scrollIntoView().trigger("mouseover", pointX, pointY).click(pointX, pointY, options);
    });
  },

  /**
   * Captures a screenshot of an element to compare later
   * @param {string} name name of the screenshot
   */
  captureCanvas(name: string) {
    return this.drawingArea.captureScreenshot(name, { withHidden: [".lsf-video-canvas"] });
  },

  /**
   * Captures a new screenshot and compares it to already taken one
   * Fails if screenshots are identical
   * @param name name of the screenshot
   * @param threshold to compare image. It's a relation between original number of pixels vs changed number of pixels
   */
  canvasShouldChange(name: string, threshold = 0.1) {
    return this.drawingArea.compareScreenshot(name, "shouldChange", { withHidden: [".lsf-video-canvas"], threshold });
  },

  /**
   * Captures a new screenshot and compares it to already taken one
   * Fails if screenshots are different
   * @param name name of the screenshot
   * @param threshold to compare image. It's a relation between original number of pixels vs changed number of pixels
   */
  canvasShouldNotChange(name: string, threshold = 0.1) {
    return this.drawingArea.compareScreenshot(name, "shouldNotChange", {
      withHidden: [".lsf-video-canvas"],
      threshold,
    });
  },

  /**
   * Captures a screenshot of the video canvas to compare later
   * @param {string} name name of the screenshot
   */
  captureVideoCanvas(name: string) {
    return this.videoCanvas.captureScreenshot(name, { withHidden: [".konvajs-content"] });
  },

  /**
   * Captures a new screenshot of the video canvas and compares it to already taken one
   * Fails if screenshots are identical
   * @param name name of the screenshot
   * @param threshold to compare image. It's a relation between original number of pixels vs changed number of pixels
   */
  videoCanvasShouldChange(name: string, threshold = 0.1) {
    return this.videoCanvas.compareScreenshot(name, "shouldChange", { withHidden: [".konvajs-content"], threshold });
  },

  /**
   * Captures a new screenshot of the video canvas and compares it to already taken one
   * Fails if screenshots are different
   * @param name name of the screenshot
   * @param threshold to compare image. It's a relation between original number of pixels vs changed number of pixels
   */
  videoCanvasShouldNotChange(name: string, threshold = 0.1) {
    return this.videoCanvas.compareScreenshot(name, "shouldNotChange", { withHidden: [".konvajs-content"], threshold });
  },

  toggleConfigModal() {
    cy.log("Toggle video config modal");
    this.configButton.click();
    // Wait for modal animation
    cy.wait(100);
  },

  enableLoopTimelineRegion() {
    cy.log("Enable Loop Timeline Region");
    this.loopTimelineRegionCheckbox.then(($checkbox) => {
      if (!$checkbox.prop("checked")) {
        this.loopTimelineRegionToggle.click();
      }
    });
  },

  disableLoopTimelineRegion() {
    cy.log("Disable Loop Timeline Region");
    this.loopTimelineRegionCheckbox.then(($checkbox) => {
      if ($checkbox.prop("checked")) {
        this.loopTimelineRegionToggle.click();
      }
    });
  },

  setLoopTimelineRegion(enabled: boolean) {
    cy.log(`Set Loop Timeline Region to: ${enabled}`);
    if (enabled) {
      this.enableLoopTimelineRegion();
    } else {
      this.disableLoopTimelineRegion();
    }
  },

  // State verification
  isLoopTimelineRegionEnabled() {
    return this.loopTimelineRegionCheckbox.should("be.checked");
  },

  isLoopTimelineRegionDisabled() {
    return this.loopTimelineRegionCheckbox.should("not.be.checked");
  },

  // Playback controls
  play() {
    cy.log("Start video playback");
    this.playButton.click();
  },

  pause() {
    cy.log("Pause video playback");
    this.pauseButton.click();
  },

  // Wait for video to be at specific frame
  waitForFrame(frameNumber: number) {
    cy.log(`Wait for video to be at frame ${frameNumber}`);
    // Wait for frame counter to show the expected frame
    this.frameCounter.should("contain.text", `${frameNumber.toString()} of`);
  },

  // Get current frame number from timeline controls
  getCurrentFrame() {
    return this.frameCounter.invoke("text").then((text) => {
      const match = text.match(/(\d+) of/);
      return match ? Number.parseInt(match[1]) : null;
    });
  },

  setCurrentFrame(frameNumber: number) {
    cy.log(`Set current frame to ${frameNumber}`);
    this.frameCounter.click();
    // select all to replace the current frame number
    this.frameCounterInput.clear();
    this.frameCounterInput.type(`${frameNumber}{enter}`);
  },

  verifyPlayingRange(startPositionMax: number, endPosition: number, withoutStopping = false) {
    const checkFrame = (lastFrame, rewind = false, waitTimes = 10) => {
      VideoView.getCurrentFrame().then((frame) => {
        if (withoutStopping ? frame > endPosition : frame === endPosition) {
          // Sequence of frames is the same as expected
          return;
        }
        if (rewind) {
          // If rewinding, we expect to see frames going back
          expect(frame).to.be.lessThan(lastFrame);
        } else {
          if (frame === lastFrame && waitTimes--) {
            // If we hit the same frame, wait a bit and check again
            cy.wait(SINGLE_FRAME_TIMEOUT);
            checkFrame(lastFrame, rewind, waitTimes);
            return;
          }
          expect(frame).to.be.greaterThan(lastFrame);
        }
        cy.wait(SINGLE_FRAME_TIMEOUT);
        checkFrame(frame);
      });
    };
    checkFrame(startPositionMax, true);
  },
};
