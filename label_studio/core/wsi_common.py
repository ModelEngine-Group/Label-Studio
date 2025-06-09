"""Common types and utilities for WSI processing"""
from __future__ import annotations

import base64
import zlib
from io import BytesIO
from typing import Callable, Literal

from PIL import Image, ImageCms

# Type definitions
ColorMode = Literal[
    'default',
    'absolute-colorimetric',
    'perceptual',
    'relative-colorimetric',
    'saturation',
    'embed',
    'ignore',
]
Transform = Callable[[Image.Image], None]

# Optimized sRGB v2 profile, CC0-1.0 license
# https://github.com/saucecontrol/Compact-ICC-Profiles/blob/bdd84663/profiles/sRGB-v2-micro.icc
# ImageCms.createProfile() generates a v4 profile and Firefox has problems
# with those: https://littlecms.com/blog/2020/09/09/browser-check/
SRGB_PROFILE_BYTES = zlib.decompress(
    base64.b64decode(
        'eNpjYGA8kZOcW8wkwMCQm1dSFOTupBARGaXA/oiBmUGEgZOBj0E2Mbm4wDfYLYQBCIoT'
        'y4uTS4pyGFDAt2sMjCD6sm5GYl7K3IkMtg4NG2wdSnQa5y1V6mPADzhTUouTgfQHII5P'
        'LigqYWBg5AGyecpLCkBsCSBbpAjoKCBbB8ROh7AdQOwkCDsErCYkyBnIzgCyE9KR2ElI'
        'bKhdIMBaCvQsskNKUitKQLSzswEDKAwgop9DwH5jFDuJEMtfwMBg8YmBgbkfIZY0jYFh'
        'eycDg8QthJgKUB1/KwPDtiPJpUVlUGu0gLiG4QfjHKZS5maWk2x+HEJcEjxJfF8Ez4t8'
        'k8iS0VNwVlmjmaVXZ/zacrP9NbdwX7OQshjxFNmcttKwut4OnUlmc1Yv79l0e9/MU8ev'
        'pz4p//jz/38AR4Nk5Q=='
    )
)
SRGB_PROFILE = ImageCms.getOpenProfile(BytesIO(SRGB_PROFILE_BYTES))

def get_transform_for_color_profile(image, color_mode: ColorMode = 'default') -> Transform:
    """Get color transform function for an image"""
    try:
        if not hasattr(image, 'color_profile') or image.color_profile is None:
            return lambda img: None
    except Exception:
        return lambda img: None
        
    mode = color_mode
    if mode == 'ignore':
        # drop ICC profile from tiles
        return lambda img: img.info.pop('icc_profile', None)
    elif mode == 'embed':
        # embed ICC profile in tiles
        return lambda img: None
    elif mode == 'default':
        intent = ImageCms.Intent(ImageCms.getDefaultIntent(image.color_profile))
    elif mode == 'absolute-colorimetric':
        intent = ImageCms.Intent.ABSOLUTE_COLORIMETRIC
    elif mode == 'relative-colorimetric':
        intent = ImageCms.Intent.RELATIVE_COLORIMETRIC
    elif mode == 'perceptual':
        intent = ImageCms.Intent.PERCEPTUAL
    elif mode == 'saturation':
        intent = ImageCms.Intent.SATURATION
    else:
        return lambda img: None
        
    transform = ImageCms.buildTransform(
        image.color_profile,
        SRGB_PROFILE,
        'RGB',
        'RGB',
        intent,
        ImageCms.Flags(0),
    )

    def xfrm(img: Image.Image) -> None:
        ImageCms.applyTransform(img, transform, True)
        # Some browsers assume we intend the display's color space if we
        # don't embed the profile. Pillow's serialization is larger, so
        # use ours.
        img.info['icc_profile'] = SRGB_PROFILE_BYTES

    return xfrm
