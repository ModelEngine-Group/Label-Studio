import os
from pathlib import Path

import openslide
import opensdpc

from .annotated_deepzoom_generator import AnnotatedDeepZoomGenerator

class DeepZoomWrapper:
    def __init__(self, full_path, tile_size:int = 254, overlap:int = 1, limit_bounds:bool = False):
        full_path = str(full_path)
        _, ext = os.path.splitext(full_path)

        if ext == ".sdpc":
            self._osr = opensdpc.OpenSdpc(full_path)
        else:
            self._osr = openslide.OpenSlide(full_path)

        self._dzg = AnnotatedDeepZoomGenerator(
            self._osr,
            full_path=Path(full_path),
            tile_size=tile_size,
            overlap=overlap,
            limit_bounds=limit_bounds,
        )

    def get_tile(self, level: int, tile: tuple[int, int]):
        return self._dzg.get_tile(level, tile)
    
    def get_dzi(self, format:str = "jpeg"):
        return self._dzg.get_dzi(format)
    
    @property
    def level_dimensions(self):
        return self._dzg.level_dimensions
    
    @property
    def level_count(self):
        return self._dzg.level_count