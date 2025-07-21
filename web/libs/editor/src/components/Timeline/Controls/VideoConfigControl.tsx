import type React from "react";
import { type FC, type MouseEvent, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Toggle } from "@humansignal/ui";
import { Block, Elem } from "../../../utils/bem";

import { IconConfig } from "@humansignal/icons";
import { ControlButton } from "../Controls";
import { Slider } from "./Slider";
import "./VideoConfigControl.scss";

const MIN_SPEED = 0.25;
const MAX_SPEED = 10;

export interface VideoConfigControlProps {
  configModal: boolean;
  onSetModal?: (e: MouseEvent<HTMLButtonElement>) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  loopTimelineRegion: boolean;
  onLoopTimelineRegionChange: (loopRegion: boolean) => void;
}

export const VideoConfigControl: FC<VideoConfigControlProps> = ({
  configModal,
  onSetModal,
  speed,
  onSpeedChange,
  loopTimelineRegion,
  onLoopTimelineRegionChange,
}) => {
  // Refs for positioning
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Effect to dynamically position the modal within the viewport
  useEffect(() => {
    // Check if modal is open and refs are attached
    if (configModal && modalRef.current && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const modal = modalRef.current;
      // Temporarily make it visible off-screen to measure its actual size
      modal.style.opacity = "0";
      modal.style.position = "fixed"; // Ensure fixed for measurement
      modal.style.top = "-9999px";
      modal.style.left = "-9999px";

      const calculatePosition = () => {
        if (!modalRef.current || !buttonRef.current) return; // Refs might detach
        const modalRect = modal.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const margin = 10; // Margin from viewport edges

        // Default position: below the button, aligned left
        let top = buttonRect.bottom + 5;
        let left = buttonRect.left;

        // Adjust top if modal goes below viewport
        if (top + modalRect.height > viewportHeight - margin) {
          // Try placing above the button first
          const topAbove = buttonRect.top - modalRect.height - 5;
          if (topAbove > margin) {
            top = topAbove; // Place above if enough space
          } else {
            top = viewportHeight - modalRect.height - margin; // Stick to bottom edge
          }
        }

        // Adjust top if modal goes above viewport
        if (top < margin) {
          top = margin;
        }

        // Adjust left if modal goes beyond right edge
        if (left + modalRect.width > viewportWidth - margin) {
          left = viewportWidth - modalRect.width - margin;
        }

        // Adjust left if modal goes beyond left edge
        if (left < margin) {
          left = margin;
        }

        // Apply calculated styles
        modal.style.top = `${top}px`;
        modal.style.left = `${left}px`;
        modal.style.opacity = "1"; // Make visible after positioning
      };

      // Calculate after a short delay or next frame to allow measurement
      requestAnimationFrame(calculatePosition);
    } else if (modalRef.current) {
      // Reset opacity when closing
      modalRef.current.style.opacity = "0";
    }
  }, [configModal]); // Rerun effect when modal visibility changes

  const handleChangePlaybackSpeed = (e: React.FormEvent<HTMLInputElement>) => {
    const _playbackSpeed = Number.parseFloat(e.currentTarget.value);
    if (isNaN(_playbackSpeed)) return;
    onSpeedChange(_playbackSpeed);
  };

  const renderModal = () => {
    const modalJSX = (
      <Elem
        block="video-config"
        name="modal"
        ref={modalRef}
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        style={{ opacity: 0, position: "fixed" }}
      >
        <Elem name="scroll-content">
          <Elem name="section-header">Playback Settings</Elem>
          <Slider
            min={MIN_SPEED}
            max={MAX_SPEED}
            step={0.05}
            value={speed}
            description={"Playback speed"}
            info={"Increase or decrease the playback speed"}
            onChange={handleChangePlaybackSpeed}
          />
          <Elem name="toggle">
            <Toggle
              checked={loopTimelineRegion}
              onChange={(e) => onLoopTimelineRegionChange(e.target.checked)}
              label="Loop Timeline Regions"
              labelProps={{ size: "small" }}
            />
          </Elem>
        </Elem>
      </Elem>
    );

    return typeof document !== "undefined" ? createPortal(modalJSX, document.body) : null;
  };

  return (
    <Block name="video-config" ref={buttonRef} onClick={(e: MouseEvent<HTMLButtonElement>) => e.stopPropagation()}>
      <ControlButton look={configModal ? "filled" : undefined} onClick={onSetModal} aria-label="Video settings">
        {<IconConfig />}
      </ControlButton>
      {configModal && renderModal()}
    </Block>
  );
};
