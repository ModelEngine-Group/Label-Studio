import { observer } from "mobx-react";
import { forwardRef, useCallback, useMemo, useEffect } from "react";
import { Block, Elem } from '../../utils/bem';
import { FF_LSDV_4711, isFF } from '../../utils/feature-flags';
import messages from '../../utils/messages';
import { ErrorMessage } from "../ErrorMessage/ErrorMessage";
import { drawSeaDragon } from "./setOpenSeaDragon";

export const RELATIVE_STAGE_WIDTH = 100;
export const RELATIVE_STAGE_HEIGHT = 100;
export const SNAP_TO_PIXEL_MODE = {
  EDGE: "edge",
  CENTER: "center",
};

export const Dragon = observer(
  forwardRef(({imageStyles, imageEntity}, ref) => {
    const getImageData = async (src) => {
      fetch(src).then(response => {
        if (!response.ok) {

        }
        return response.text();
      }).then(xmlString => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "application/xml");
        const imageElement = xmlDoc.documentElement;
        const sizeElement = xmlDoc.querySelector("Size");

        const tileSize = imageElement.getAttribute("TileSize");
        const width = sizeElement.getAttribute("Width");
        const height = sizeElement.getAttribute('Height')
        viewer = drawSeaDragon(imageEntity.src, width -0,height-0,tileSize-0);
      })

    }

    let viewer = null;
    if (imageEntity.src) {
      getImageData(imageEntity.src);
    }
    useEffect(() => {
      if(viewer) {
        viewer.destroy();
        viewer = null;
      }
      if (imageEntity.src) {
        getImageData(imageEntity.src);
      }
    }, [imageStyles, imageEntity.src])
    return (<></>);
  }),
);
