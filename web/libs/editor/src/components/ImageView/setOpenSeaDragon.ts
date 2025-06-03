import { ImageList } from "../../examples/image_list";

let viewer: any = null;

export const drawSeaDragon = (src: any, width: any, height: any, tileSize: any)=> {
  const OpenSeaDragon = (window as any)?.OpenSeadragon;
  const container = document.querySelector('#img-mem-view');
  if (!src || !height || !width || !tileSize) {
    return;
  }

  if (viewer) {
    viewer.destroy();
    viewer = null;
  }

  if (!src && viewer) {
    viewer.destroy();
    viewer = null;
    return;
  }
  if (!container && viewer) {
    viewer.destroy();
    viewer = null;
  }

  if (container && !viewer && OpenSeaDragon) {
    viewer = new OpenSeaDragon({
        id: "img-mem-view",
        tileSources: [
          {
            width,
            height,
            tileSize,
            getTileUrl: function (level: string, x: string, y: string) {
              return `${src}&level=${level}&row=${y}&col=${x}`;
            }
          }
        ],
        sequenceMode: true,
        preserveViewport: true,
        prefixUrl: "/static/images/",
        showNavigator: true,
        showRotationControl: true,
        animationTime: 2,
        imageLoaderLimit: 6,
        springStiffness: 3,
        blendTime: 0.1,
        constrainDuringPan: true,
        maxZoomPixelRatio: 2,
        minZoomImageRatio: 1,
        visibilityRatio: 1,
        zoomPerScroll: 2,
        timeout: 120000,
        showNavigationControl: true,
        setMouseNavEnabled: true,
    });
  }

  return viewer;
};
