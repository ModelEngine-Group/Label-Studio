from __future__ import annotations
from collections.abc import Callable
import os
from pathlib import Path

import cv2
import openslide
from openslide.deepzoom import DeepZoomGenerator
from typing import TYPE_CHECKING
from PIL import Image
import numpy as np
import math

if TYPE_CHECKING:
    from typing import TypeAlias

    Transform: TypeAlias = Callable[[Image.Image], None]

ENABLE_DEBUG = False


class AnnotatedDeepZoomGenerator(DeepZoomGenerator):
    filename: str
    full_path: Path
    mpp: float
    transform: Transform

    def __init__(
        self,
        osr,
        full_path: Path,
        tile_size: int = 254,
        overlap: int = 1,
        limit_bounds: bool = False,
    ):
        super().__init__(osr, tile_size, overlap, limit_bounds)
        # heatmap = full_path.with_name(f"{full_path.stem}.heatmap.npy")
        self.is_sdpc = full_path.suffix == ".sdpc"
        # print(f"[HEATMAP] (exist: {os.path.isfile(heatmap)}) fetching heatmap: ", heatmap)
        self.visited = set()
        # if os.path.isfile(heatmap):
        #     self.color_mask = np.load(heatmap)

        #     self.actual_size = self.color_mask.shape
        #     gap = [abs(dim[0] - self.actual_size[1]) for dim in self._osr.level_dimensions]
        #     self.ratio = gap.index(min(gap))
        #     self.region_size = self._osr.level_dimensions[self.ratio]
        #     largest = self._osr.level_dimensions[0]
        #     # down_sample = self._osr.level_downsamples[self.ratio]
        #     down_sample = 1 << round(math.log2(largest[0] / self.actual_size[1]))
        #     offset = (
        #         largest[0] / down_sample - self.color_mask.shape[1],
        #         largest[1] / down_sample - self.color_mask.shape[0]
        #     )
        #     print(f"valid: {0 if any(offset) else 1} offset: ", offset)
        # else:
        #     self.color_mask = None
        #     self.ratio = None
        #     self.region_size = None

    def get_tile(
        self, level: int, address: tuple[int, int], heatmap=False
    ) -> Image.Image:
        """Return an RGB PIL.Image for a tile.

        level:     the Deep Zoom level.
        address:   the address of the tile within the level as a (col, row)
                   tuple.
        heatmap:   need heatmap overlay"""
        args, z_size = self._get_tile_info(level, address)

        if ENABLE_DEBUG and level not in self.visited:
            print("read_regoin: ", args)

        tile = self._osr.read_region(*args)
        profile = tile.info.get("icc_profile")

        # Apply on solid background
        if isinstance(self._osr, openslide.OpenSlide):
            bg = Image.new("RGB", tile.size, self._bg_color)
            tile = Image.composite(tile, bg, tile)
        if heatmap and self.color_mask is not None:
            tile = Image.fromarray(self._mask_tile(tile, *args))

        # Scale to the correct size
        if tile.size != z_size:
            # Image.Resampling added in Pillow 9.1.0
            # Image.LANCZOS removed in Pillow 10
            tile.thumbnail(z_size, getattr(Image, "Resampling", Image).LANCZOS)

        # Reference ICC profile
        if profile is not None:
            tile.info["icc_profile"] = profile

        return tile

    def _mask_tile(
        self, tile: Image, location: tuple[int, int], level: int, size: tuple[int, int]
    ) -> np.ndarray:
        region_size = (self.actual_size[1], self.actual_size[0])
        if self.is_sdpc:
            # down_sample = self._osr.level_downsamples[self.ratio]
            down_sample = 1 << round(math.log2(self._osr.level_dimensions[0][0] / self.actual_size[1]))
            lv_downsample = self._osr.level_downsamples[level]
            scale = (lv_downsample / down_sample, lv_downsample / down_sample)
            max_scale = (1 / down_sample, 1 / down_sample)
        else:
            lv_dim = self._osr.level_dimensions[level]
            max_dim = self._osr.level_dimensions[0]
            scale = (region_size[0] / lv_dim[0], region_size[1] / lv_dim[1])
            max_scale = (region_size[0] / max_dim[0], region_size[1] / max_dim[1])
        x_img = int(location[0] * max_scale[0])
        y_img = int(location[1] * max_scale[1])
        x_end = min(int(x_img + size[0] * scale[0]), region_size[0])
        y_end = min(int(y_img + size[1] * scale[1]), region_size[1])

        tile_arr = np.array(tile.convert("RGB"))

        color_mask = self.color_mask[y_img:y_end, x_img:x_end]
        
        if ENABLE_DEBUG and level not in self.visited:
            print("max_scale", max_scale)
            print("lv: ", level)
            print("region_size: ", region_size)
            print("color_mask", color_mask.shape)
            print("ori_color_mask", self.color_mask.shape)
            print("size", size)
            print("mask_size", color_mask.shape)
            print("lv_downsample", self._osr.level_downsamples)
            print("lv_dimension", self._osr.level_dimensions)
            print("get_best_level_for_downsample ", self._osr.get_best_level_for_downsample(self.ratio))
            print(f"taking mask ({x_img}, {y_img}) with len ({color_mask.shape[1]}, {color_mask.shape[0]})")
            self.visited.add(level)
        if color_mask.shape[0] == 0 or color_mask.shape[1] == 0:
            return tile_arr
        # color_mask = self._resize_image(color_mask, (size[1], size[0]))
        color_mask = cv2.resize(color_mask, size)

        weighted = color_mask * 0.4 + tile_arr * 0.6
        ret = np.clip(weighted, 0, 255).astype(np.uint8)
        return ret

    def _resize_image(self, image, new_size):
        resized_image = np.zeros(
            (new_size[0], new_size[1], image.shape[2]), dtype=image.dtype
        )
        row_scale = image.shape[0] / new_size[0]
        col_scale = image.shape[1] / new_size[1]

        for j in range(new_size[1]):
            for i in range(new_size[0]):
                src_row = int(i * row_scale)
                src_col = int(j * col_scale)
                resized_image[i, j] = image[src_row, src_col]
        return resized_image
