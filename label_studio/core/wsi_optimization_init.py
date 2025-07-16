"""WSI optimization initializer - loads when Label Studio starts"""
import logging
import os
from django.conf import settings
from django.apps import AppConfig

logger = logging.getLogger(__name__)

class WSIOptimizationConfig(AppConfig):
    name = 'core.wsi_optimization'
    verbose_name = 'WSI Optimizations'

    def ready(self):
        """Initialize WSI optimization components when Django starts"""
        # Import here to avoid circular imports
        from .wsi_optimizations import initialize_slide_cache
        
        # Read from environment variables first, then from Django settings, then use defaults
        # For WSI_SLIDE_CACHE_SIZE (number of slides to cache)
        try:
            env_cache_size = int(os.environ.get('WSI_SLIDE_CACHE_SIZE', '0'))
            cache_size = env_cache_size if env_cache_size > 0 else getattr(settings, 'WSI_SLIDE_CACHE_SIZE', 64)
        except (ValueError, TypeError):
            cache_size = getattr(settings, 'WSI_SLIDE_CACHE_SIZE', 64)
            
        # For WSI_TILE_CACHE_MB (size of tile cache in MB)
        try:
            env_tile_cache_mb = int(os.environ.get('WSI_TILE_CACHE_MB', '0'))
            tile_cache_mb = env_tile_cache_mb if env_tile_cache_mb > 0 else getattr(settings, 'WSI_TILE_CACHE_MB', 1024)
        except (ValueError, TypeError):
            tile_cache_mb = getattr(settings, 'WSI_TILE_CACHE_MB', 1024)
            
        # For color mode
        env_color_mode = os.environ.get('WSI_COLOR_MODE')
        color_mode = env_color_mode if env_color_mode else getattr(settings, 'WSI_COLOR_MODE', 'default')
        
        # Initialize the slide cache with settings
        initialize_slide_cache(
            cache_size=cache_size,
            tile_cache_mb=tile_cache_mb,
            color_mode=color_mode
        )
        
        # Log the configuration
        logger.info(f"WSI optimization initialized with cache_size={cache_size}, tile_cache_mb={tile_cache_mb}, color_mode={color_mode}")
        
        # Log the source of configuration
        if os.environ.get('WSI_SLIDE_CACHE_SIZE'):
            logger.info(f"WSI_SLIDE_CACHE_SIZE from environment variable: {os.environ.get('WSI_SLIDE_CACHE_SIZE')}")
        if os.environ.get('WSI_TILE_CACHE_MB'):
            logger.info(f"WSI_TILE_CACHE_MB from environment variable: {os.environ.get('WSI_TILE_CACHE_MB')}")
        if os.environ.get('WSI_COLOR_MODE'):
            logger.info(f"WSI_COLOR_MODE from environment variable: {os.environ.get('WSI_COLOR_MODE')}")

default_app_config = 'core.wsi_optimization_init.WSIOptimizationConfig'
