import OpenSeadragon from 'openseadragon';

// Make OpenSeadragon available globally
if (typeof window !== 'undefined') {
  (window as any).OpenSeadragon = OpenSeadragon;
}

let viewer: any = null;
let _scalebar: any = null;
let _scalebarInitialized: boolean = false;
let _viewportInfoDiv: HTMLElement | null = null;

async function fetchDziMpp(dziUrl: string): Promise<number | null> {
  try {
    // try to fetch the DZI XML and parse MPP if present in properties
    const resp = await fetch(dziUrl, { cache: "no-cache" });
    if (!resp.ok) return null;

    const text = await resp.text();
    console.log('DZI XML received:', text);

    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");

    // search for common property nodes that may contain mpp information
    // e.g. <Property Name="openslide.mpp-x">0.25</Property>
    const propNodes = Array.from(xml.querySelectorAll("Property, Metadata"));
    console.log('Found Property/Metadata nodes:', propNodes.length);

    for (const node of propNodes) {
      const nameAttr = node.getAttribute ? node.getAttribute("Name") || node.getAttribute("name") : null;
      const textVal = (node.textContent || "").trim();
      console.log('Property node:', { name: nameAttr, value: textVal });

      if (nameAttr && /mpp|micron|micrometer|physical/i.test(nameAttr) && textVal) {
        const v = parseFloat(textVal);
        if (!Number.isNaN(v) && v > 0) {
          console.log('MPP found from Property node:', v);
          return v;
        }
      }
      // fallback: if node text contains 'mpp' like 'mpp-x=0.25'
      const maybe = (node.textContent || "").match(/mpp(?:[-_ ]?x)?\s*[=:\s]\s*([0-9.\.eE+-]+)/i);
      if (maybe && maybe[1]) {
        const v = parseFloat(maybe[1]);
        if (!Number.isNaN(v) && v > 0) {
          console.log('MPP found from text pattern:', v);
          return v;
        }
      }
    }

    // also try root attributes on <Image>
    const imageEl = xml.querySelector("Image");
    if (imageEl) {
      const physical = imageEl.getAttribute("PhysicalSize") || imageEl.getAttribute("PhysicalSizeX") || imageEl.getAttribute("PhysicalSizeXMicrons");
      if (physical) {
        const v = parseFloat(physical);
        if (!Number.isNaN(v) && v > 0) return v;
      }
    }
  } catch (err) {
    // ignore fetch/parse errors
    // console.warn("DZI fetch/parse failed", err);
  }
  // try to parse mpp from URL query params as last resort
  try {
    const u = new URL(dziUrl, window.location.href);
    const qp = u.searchParams.get("mpp") || u.searchParams.get("microns_per_pixel") || u.searchParams.get("micronspx");
    if (qp) {
      const v = parseFloat(qp);
      if (!Number.isNaN(v) && v > 0) return v;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function destroyScalebar() {
  try {
    // First try to destroy via viewer's scalebarInstance
    if (viewer && viewer.scalebarInstance) {
      console.log('Destroying viewer scalebarInstance');
      if (typeof viewer.scalebarInstance.destroy === 'function') {
        viewer.scalebarInstance.destroy();
      }
      viewer.scalebarInstance = null;
    }

    // Also destroy our reference if it exists
    if (_scalebar && typeof _scalebar.destroy === "function") {
      console.log('Destroying _scalebar reference');
      _scalebar.destroy();
    }

    // Also manually remove any leftover scalebar divs from the DOM
    const container = document.querySelector('#img-mem-view');
    if (container) {
      const scalebarDivs = container.querySelectorAll('div[style*="pointer-events: none"]');
      console.log('Found ' + scalebarDivs.length + ' potential scalebar divs');
      scalebarDivs.forEach((div: any) => {
        // Check if it looks like a scalebar div (has border-bottom or border styling)
        const hasScalebarStyle = div.style.borderBottom || div.style.border;
        if (hasScalebarStyle) {
          console.log('Removing scalebar div from DOM');
          div.remove();
        }
      });
    }
  } catch (e) {
    console.error('Error destroying scalebar:', e);
  }
  _scalebar = null;
  _scalebarInitialized = false;
}

function destroyViewportInfo() {
  if (_viewportInfoDiv && _viewportInfoDiv.parentNode) {
    _viewportInfoDiv.parentNode.removeChild(_viewportInfoDiv);
  }
  _viewportInfoDiv = null;
}

function createViewportInfoDisplay(container: Element, mpp: number | null) {
  // Remove existing viewport info if any
  destroyViewportInfo();

  // Create a div to display viewport physical dimensions
  _viewportInfoDiv = document.createElement('div');
  _viewportInfoDiv.style.position = 'absolute';
  _viewportInfoDiv.style.bottom = '10px';
  _viewportInfoDiv.style.left = '10px'; // Position at lower left corner
  _viewportInfoDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  _viewportInfoDiv.style.padding = '8px 12px';
  _viewportInfoDiv.style.borderRadius = '4px';
  _viewportInfoDiv.style.fontSize = '13px';
  _viewportInfoDiv.style.fontFamily = 'monospace';
  _viewportInfoDiv.style.color = '#000';
  _viewportInfoDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  _viewportInfoDiv.style.zIndex = '1000';
  _viewportInfoDiv.style.pointerEvents = 'none';
  _viewportInfoDiv.innerHTML = 'Loading...';

  container.appendChild(_viewportInfoDiv);

  // Update function
  const updateViewportInfo = () => {
    if (!viewer || !_viewportInfoDiv) return;

    try {
      const viewport = viewer.viewport;
      const bounds = viewport.getBounds(true);
      const containerSize = viewer.viewport.getContainerSize();

      // Get the current zoom level
      const zoom = viewport.getZoom(true);

      // Get image dimensions at level 0 (full resolution)
      const tiledImage = viewer.world.getItemAt(0);
      if (!tiledImage) return;

      const imageDimensions = tiledImage.source.dimensions;

      // Calculate viewport dimensions in image pixels
      // bounds are in normalized coordinates (0-1), so multiply by image dimensions
      const viewportWidthPx = bounds.width * imageDimensions.x;
      const viewportHeightPx = bounds.height * imageDimensions.y;

      if (mpp && mpp > 0) {
        // Calculate physical dimensions
        const widthMicrons = viewportWidthPx * mpp;
        const heightMicrons = viewportHeightPx * mpp;
        const areaMicrons2 = widthMicrons * heightMicrons;

        // Convert to appropriate units
        let widthStr, heightStr, areaStr;

        // Width
        if (widthMicrons < 1000) {
          widthStr = widthMicrons.toFixed(1) + ' μm';
        } else if (widthMicrons < 1000000) {
          widthStr = (widthMicrons / 1000).toFixed(2) + ' mm';
        } else {
          widthStr = (widthMicrons / 1000000).toFixed(2) + ' m';
        }

        // Height
        if (heightMicrons < 1000) {
          heightStr = heightMicrons.toFixed(1) + ' μm';
        } else if (heightMicrons < 1000000) {
          heightStr = (heightMicrons / 1000).toFixed(2) + ' mm';
        } else {
          heightStr = (heightMicrons / 1000000).toFixed(2) + ' m';
        }

        // Area (convert to mm²)
        const areaMm2 = areaMicrons2 / 1000000;
        if (areaMm2 < 1) {
          areaStr = (areaMicrons2 / 1000).toFixed(2) + ' μm²';
        } else if (areaMm2 < 1000000) {
          areaStr = areaMm2.toFixed(2) + ' mm²';
        } else {
          areaStr = (areaMm2 / 1000000).toFixed(2) + ' m²';
        }

        _viewportInfoDiv.innerHTML = `
          <div><strong>Viewport Size</strong></div>
          <div>${widthStr} × ${heightStr}</div>
          <div>Area: ${areaStr}</div>
        `;
      } else {
        // No MPP, show pixel dimensions
        _viewportInfoDiv.innerHTML = `
          <div><strong>Viewport Size</strong></div>
          <div>${Math.round(viewportWidthPx)} × ${Math.round(viewportHeightPx)} px</div>
        `;
      }
    } catch (e) {
      console.error('Error updating viewport info:', e);
    }
  };

  // Update on viewport change
  viewer.addHandler('animation', updateViewportInfo);
  viewer.addHandler('resize', updateViewportInfo);

  // Initial update
  updateViewportInfo();
} export const drawSeaDragon = (src: any, width: any, height: any, tileSize: any) => {
  const container = document.querySelector('#img-mem-view');

  if (!src || !height || !width || !tileSize) {
    return;
  }

  if (viewer) {
    try {
      viewer.destroy();
    } catch (e) { }
    viewer = null;
  }

  destroyScalebar();
  destroyViewportInfo();

  if (!src && viewer) {
    try {
      viewer.destroy();
    } catch (e) { }
    viewer = null;
    return;
  }
  if (!container && viewer) {
    try {
      viewer.destroy();
    } catch (e) { }
    viewer = null;
  }

  if (container && !viewer) {
    viewer = new OpenSeadragon({
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
      sequenceMode: false,
      preserveViewport: true,
      prefixUrl: "/static/images/",
      showNavigator: false,
      navigatorPosition: "TOP_RIGHT",
      navigatorAutoResize: true,
      navigatorAutoFade: true,
      showRotationControl: true,
      animationTime: 0.5,
      imageLoaderLimit: 6,
      springStiffness: 7,
      blendTime: 0.1,
      constrainDuringPan: true,
      maxZoomPixelRatio: 2,
      minZoomImageRatio: 1,
      visibilityRatio: 1,
      zoomPerScroll: 1.1,  // Controls zoom speed (lower = slower, higher = faster)
      timeout: 120000,
      showNavigationControl: false,
      setMouseNavEnabled: true,
    });

    console.log('OpenSeadragon viewer created with navigator:', viewer);

    // initialize scalebar if extension available
    viewer.addHandler('open', async function scalebarHandler() {
      try {
        // Prevent duplicate initialization
        if (_scalebarInitialized) {
          console.log('Scalebar already initialized, skipping...');
          return;
        }
        _scalebarInitialized = true;
        console.log('Initializing scalebar...');

        // Check if scalebar extension is loaded
        if (!(OpenSeadragon as any).Scalebar) {
          console.warn('OpenSeadragon Scalebar extension not loaded');
          return;
        }

        // try to obtain microns-per-pixel from DZI or URL
        const mpp = await fetchDziMpp(src); // microns per pixel
        let pixelsPerMeter: number | null = null;

        if (mpp && mpp > 0) {
          // convert microns-per-pixel to pixels-per-meter
          pixelsPerMeter = 1e6 / mpp;
        }

        // prepare options - always create a scalebar
        const scalebarOptions: any = {
          minWidth: "150px",
          location: (OpenSeadragon as any).ScalebarLocation.TOP_LEFT,
          xOffset: 10,
          yOffset: 10,
          stayInsideImage: false, // false to prevent being cut off at edges
          color: "#000000",
          fontColor: "#000000",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          fontSize: "14px",
          barThickness: 3,
        };

        if (pixelsPerMeter && pixelsPerMeter > 0) {
          // Use physical units (METRIC_LENGTH automatically selects m/cm/mm/μm)
          scalebarOptions.type = (OpenSeadragon as any).ScalebarType.MICROSCOPY;
          scalebarOptions.pixelsPerMeter = pixelsPerMeter;
          scalebarOptions.sizeAndTextRenderer = (OpenSeadragon as any).ScalebarSizeAndTextRenderer.METRIC_LENGTH;
        } else {
          // Fallback: use a nominal pixelsPerMeter with metric units
          // This will show metric units based on image pixels
          scalebarOptions.type = (OpenSeadragon as any).ScalebarType.MICROSCOPY;
          scalebarOptions.pixelsPerMeter = 1000; // treat 1 pixel as 1mm for display purposes
          scalebarOptions.sizeAndTextRenderer = (OpenSeadragon as any).ScalebarSizeAndTextRenderer.METRIC_LENGTH;
        }

        destroyScalebar();

        // Use the viewer.scalebar() method instead of new Scalebar()
        // This prevents duplicate instances
        viewer.scalebar(scalebarOptions);
        _scalebar = viewer.scalebarInstance;
        console.log('Scalebar initialized successfully');

        // Create viewport info display
        const container = document.querySelector('#img-mem-view');
        if (container) {
          createViewportInfoDisplay(container, mpp);
          console.log('Viewport info display created');
        }
      } catch (err) {
        console.error("Scalebar initialization error:", err);
      }
    });
  }

  return viewer;
};
