"""This file contains optimizations for WSI (Whole Slide Image) processing and serving."""
from __future__ import annotations

from collections import OrderedDict
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List, Optional, Union

import openslide
from openslide import OpenSlideCache, OpenSlideError

from .wsi_common import ColorMode, get_transform_for_color_profile

class SlideCache:
    """Cache for WSI slides to improve performance"""
    def __init__(
        self,
        cache_size: int = 64,
        tile_cache_mb: int = 512,
        dz_opts: Optional[Dict[str, Any]] = None,
        color_mode: ColorMode = 'default',
    ):
        # Import here to avoid circular imports
        from .deepzoom_util import DeepZoomWrapper
        
        self.DeepZoomWrapper = DeepZoomWrapper
        self.cache_size = cache_size
        self.dz_opts = dz_opts or {
            'tile_size': 254,
            'overlap': 1,
            'limit_bounds': False,
        }
        self.color_mode = color_mode
        self._lock = Lock()
        self._cache: OrderedDict = OrderedDict()
        
        # Share a single tile cache among all slide handles, if supported
        try:
            self._tile_cache = OpenSlideCache(tile_cache_mb * 1024 * 1024)
        except Exception:
            self._tile_cache = None

    def get(self, path: Union[str, Path]) -> Any:
        """Get a slide from cache or load it if not cached"""
        path = Path(path)
        
        with self._lock:
            if path in self._cache:
                # Move to end of LRU cache
                slide = self._cache.pop(path)
                self._cache[path] = slide
                return slide

        slide = self.DeepZoomWrapper(
            str(path),
            **self.dz_opts
        )
        
        # Set transform function for color profile handling
        if hasattr(slide, '_osr'):
            try:
                osr = slide._osr
                slide.transform = get_transform_for_color_profile(osr, self.color_mode)
            except Exception:
                slide.transform = lambda img: None
        
        # Add to cache
        with self._lock:
            if path not in self._cache:
                if len(self._cache) == self.cache_size:
                    self._cache.popitem(last=False)  # Remove oldest item (FIFO)
                self._cache[path] = slide
                
        return slide

# Initialize a global slide cache - this will be properly initialized when first imported
# by the Django app which will have access to settings
SLIDE_CACHE = None

def initialize_slide_cache(cache_size=64, tile_cache_mb=1024, color_mode='default'):
    """Initialize the slide cache with proper settings"""
    global SLIDE_CACHE
    
    if SLIDE_CACHE is None:
        SLIDE_CACHE = SlideCache(
            cache_size=cache_size,  # Cache slides
            tile_cache_mb=tile_cache_mb,  # Tile cache size in MB
            color_mode=color_mode
        )
    
    return SLIDE_CACHE

# Default initialization - will be replaced when Django settings are available
SLIDE_CACHE = SlideCache(
    cache_size=64,  # Cache up to 64 slides
    tile_cache_mb=4096  # Use 4GB for tile caching
)