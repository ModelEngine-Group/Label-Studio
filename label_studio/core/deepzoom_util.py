import os
import io
from pathlib import Path
from typing import Any, Callable, Optional, Tuple, Union

import openslide
import opensdpc
from PIL import Image

from .annotated_deepzoom_generator import AnnotatedDeepZoomGenerator
from .wsi_common import Transform, get_transform_for_color_profile

class DeepZoomWrapper:
    """Enhanced DeepZoomWrapper with performance optimizations for WSI image viewing"""
    
    def __init__(self, full_path, tile_size:int = 254, overlap:int = 1, limit_bounds:bool = False):
        full_path_str = str(full_path)
        self.path = full_path_str
        self.filename = os.path.basename(full_path_str)
        _, ext = os.path.splitext(full_path_str)
        
        # Track if the slide was opened with OpenSdpc
        self.is_sdpc = ext.lower() == ".sdpc"
        
        # Load the appropriate slide object
        if self.is_sdpc:
            self._osr = opensdpc.OpenSdpc(full_path_str)
        else:
            self._osr = openslide.OpenSlide(full_path_str)
        
        # Setup the deep zoom generator
        self._dzg = AnnotatedDeepZoomGenerator(
            self._osr,
            full_path=Path(full_path_str),
            tile_size=tile_size,
            overlap=overlap,
            limit_bounds=limit_bounds,
        )
        
        # Set MPP (microns per pixel) if available
        self.mpp = 0
        try:
            if not self.is_sdpc:
                mpp_x = float(self._osr.properties.get(openslide.PROPERTY_NAME_MPP_X, 0))
                mpp_y = float(self._osr.properties.get(openslide.PROPERTY_NAME_MPP_Y, 0))
                if mpp_x > 0 and mpp_y > 0:
                    self.mpp = (mpp_x + mpp_y) / 2
        except (KeyError, ValueError):
            pass
        
        # Default transform (no-op)
        self.transform: Transform = lambda img: None

    def get_tile(self, level: int, tile: tuple[int, int]) -> Image.Image:
        """Get a tile with optimized color profile handling"""
        # Get the tile
        tile_img = self._dzg.get_tile(level, tile)
        
        # Apply color transformation if needed
        if hasattr(self, 'transform'):
            self.transform(tile_img)
            
        return tile_img
    
    def get_dzi(self, format:str = "jpeg") -> str:
        """Get the DZI XML for this slide"""
        return self._dzg.get_dzi(format)
    
    def get_tile_bytes(self, level: int, tile: tuple[int, int], format:str = "jpeg", quality:int = 75) -> bytes:
        """Get a tile as bytes, optimized for HTTP response"""
        # Get the tile with any color transformations applied
        tile_img = self.get_tile(level, tile)
        
        # Convert to bytes with specified format and quality
        buf = io.BytesIO()
        tile_img.save(
            buf,
            format,
            quality=quality,
            icc_profile=tile_img.info.get('icc_profile'),
        )
        buf.seek(0)
        return buf.getvalue()
    
    @property
    def level_dimensions(self):
        return self._dzg.level_dimensions
    
    @property
    def level_count(self):
        return self._dzg.level_count