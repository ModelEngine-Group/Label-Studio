"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
import io
import json
import logging
import mimetypes
import os
import posixpath
from pathlib import Path
from wsgiref.util import FileWrapper
from io import BytesIO
import time

import pandas as pd
import requests
from core import utils
from core.feature_flags import all_flags, flag_set, get_feature_file_path
from core.label_config import generate_time_series_json
from core.utils.common import collect_versions
from core.utils.io import find_file
from django.conf import settings
from django.contrib.auth import logout
from django.db.models import CharField, F, Value
from django.http import (
    HttpResponse,
    HttpResponseForbidden,
    HttpResponseNotFound,
    JsonResponse,
)
from django.shortcuts import redirect, render, reverse
from django.utils._os import safe_join
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from drf_spectacular.utils import extend_schema
from io_storages.localfiles.models import LocalFilesImportStorage
from ranged_fileresponse import RangedFileResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .deepzoom_util import DeepZoomWrapper

# Create dedicated loggers with direct console output
logger = logging.getLogger(__name__)

# Create a WSI logger specifically for WSI operations
wsi_logger = logging.getLogger('server')
if not wsi_logger.handlers:
    wsi_handler = logging.StreamHandler()
    wsi_handler.setFormatter(logging.Formatter('[%(asctime)s] [WSI] %(levelname)s: %(message)s'))
    wsi_logger.addHandler(wsi_handler)
    wsi_logger.setLevel(logging.INFO)  # Make sure it's visible
    wsi_logger.propagate = False  # Don't propagate to root logger


_PARAGRAPH_SAMPLE = None


def main(request):
    user = request.user

    if user.is_authenticated:

        if user.active_organization is None and 'organization_pk' not in request.session:
            logout(request)
            return redirect(reverse('user-login'))

        # business mode access
        if flag_set('fflag_all_feat_dia_1777_ls_homepage_short', user):
            print('redirect to home page')
            return render(request, 'home/home.html')
        else:
            return redirect(reverse('projects:project-index'))

    # not authenticated
    return redirect(reverse('user-login'))


def version_page(request):
    """Get platform version"""
    # update the latest version from pypi response
    # from label_studio.core.utils.common import check_for_the_latest_version
    # check_for_the_latest_version(print_message=False)
    http_page = request.path == '/version/'
    result = collect_versions(force=http_page)

    # html / json response
    if request.path == '/version/':
        # other settings from backend
        if not getattr(settings, 'CLOUD_INSTANCE', False) and request.user.is_superuser:
            result['settings'] = {
                key: str(getattr(settings, key))
                for key in dir(settings)
                if not key.startswith('_') and not hasattr(getattr(settings, key), '__call__')
            }

        result = json.dumps(result, indent=2)
        result = result.replace('},', '},\n').replace('\\n', ' ').replace('\\r', '')
        return HttpResponse('<pre>' + result + '</pre>')
    else:
        return JsonResponse(result)


def health(request):
    """System health info"""
    logger.debug('Got /health request.')
    return HttpResponse(json.dumps({'status': 'UP'}))


def metrics(request):
    """Empty page for metrics evaluation"""
    return HttpResponse('')


class TriggerAPIError(APIView):
    """500 response for testing"""

    authentication_classes = ()
    permission_classes = ()

    @extend_schema(exclude=True)
    def get(self, request):
        raise Exception('test')


def editor_files(request):
    """Get last editor files"""
    response = utils.common.find_editor_files()
    return HttpResponse(json.dumps(response), status=200)


def samples_time_series(request):
    """Generate time series example for preview"""
    time_column = request.GET.get('time', '')
    value_columns = request.GET.get('values', '').split(',')
    time_format = request.GET.get('tf')

    # separator processing
    separator = request.GET.get('sep', ',')
    separator = separator.replace('\\t', '\t')
    aliases = {'dot': '.', 'comma': ',', 'tab': '\t', 'space': ' '}
    if separator in aliases:
        separator = aliases[separator]

    # check headless or not
    header = True
    if all(n.isdigit() for n in [time_column] + value_columns):
        header = False

    # generate all columns for headless csv
    if not header:
        max_column_n = max([int(v) for v in value_columns] + [0])
        value_columns = range(1, max_column_n + 1)

    ts = generate_time_series_json(time_column, value_columns, time_format)
    csv_data = pd.DataFrame.from_dict(ts).to_csv(index=False, header=header, sep=separator).encode('utf-8')

    # generate response data as file
    filename = 'time-series.csv'
    response = HttpResponse(csv_data, content_type='application/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    response['filename'] = filename
    return response


def samples_paragraphs(request):
    """Generate paragraphs example for preview"""
    global _PARAGRAPH_SAMPLE

    if _PARAGRAPH_SAMPLE is None:
        with open(find_file('paragraphs.json'), encoding='utf-8') as f:
            _PARAGRAPH_SAMPLE = json.load(f)
    name_key = request.GET.get('nameKey', 'author')
    text_key = request.GET.get('textKey', 'text')

    result = []
    for line in _PARAGRAPH_SAMPLE:
        result.append({name_key: line['author'], text_key: line['text']})

    return HttpResponse(json.dumps(result), content_type='application/json')


def heidi_tips(request):
    """Fetch live tips from github raw liveContent.json to avoid caching and client side CORS issues"""
    url = 'https://raw.githubusercontent.com/HumanSignal/label-studio/refs/heads/develop/web/apps/labelstudio/src/components/HeidiTips/liveContent.json'

    response = None
    try:
        response = requests.get(
            url,
            headers={'Cache-Control': 'no-cache', 'Content-Type': 'application/json', 'Accept': 'application/json'},
            timeout=5,
        )
        # Raise an exception for bad status codes to avoid caching
        response.raise_for_status()
    # Catch all exceptions and return either the status code if there was a response, or default to 404 if there are network issues
    # This is done this way to catch thrown exceptions from the request itself which will occur for air-gapped environments
    except Exception:
        # Any other HTTP error will return the error code, and other errors like connection/timeout errors will be a 404
        content = {}
        status_code = 404
        if response is not None:
            content['detail'] = response.reason
            status_code = response.status_code
        return HttpResponse(json.dumps(content), content_type='application/json', status=status_code)

    return HttpResponse(response.content, content_type='application/json')


@extend_schema(exclude=True)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def localfiles_data(request):
    """Serving files for LocalFilesImportStorage with optimized WSI handling"""
    # Start timing the entire request
    api_start = time.time()
    
    # Log request details
    request_path = request.GET.get('d', '')
    wsi_logger.debug(f'Request: {request_path}')
    
    user = request.user
    path = request.GET.get('d')
    level = request.GET.get('level')
    col = request.GET.get('col')
    row = request.GET.get('row')

    wsi_logger.info(f'Request started: path={path}, level={level}, col={col}, row={row}')

    if settings.LOCAL_FILES_SERVING_ENABLED is False:
        wsi_logger.debug(f'Request rejected: LOCAL_FILES_SERVING_ENABLED is False')
        return HttpResponseForbidden(
            "Serving local files can be dangerous, so it's disabled by default. "
            'You can enable it with LOCAL_FILES_SERVING_ENABLED environment variable, '
            'please check docs: https://labelstud.io/guide/storage.html#Local-storage'
        )

    # Start timing path resolution and permissions
    path_start = time.time()
    
    local_serving_document_root = settings.LOCAL_FILES_DOCUMENT_ROOT
    if path and request.user.is_authenticated:
        path = posixpath.normpath(path).lstrip('/')
        full_path = Path(safe_join(local_serving_document_root, path))
        
        wsi_logger.debug(f'Path resolution: {time.time() - path_start:.4f}s, full_path={full_path}')

        # Check if the file is a WSI file
        ext = os.path.splitext(full_path)[1].lower()
        is_wsi = ext in ['.svs', '.sdpc', '.tif', '.tiff', '.csp', '.kfb']
        
        # Log file type
        wsi_logger.debug(f'File type check: extension={ext}, is_wsi={is_wsi}')

        # Start timing database operations
        db_start = time.time()
        
        # Try to find Local File Storage connection based prefix:
        # storage.path=/home/user, full_path=/home/user/a/b/c/1.jpg =>
        # full_path.startswith(path) => True
        localfiles_storage = LocalFilesImportStorage.objects.annotate(
            _full_path=Value(os.path.dirname(full_path), output_field=CharField())
        ).filter(_full_path__startswith=F('path'))
        
        wsi_logger.debug(f'Database query: {time.time() - db_start:.4f}s')
        
        # Start timing permission check
        perm_start = time.time()
        
        # Check if user has permissions to access this storage
        user_has_permissions = False
        if localfiles_storage.exists():
            user_has_permissions = any(storage.project.has_permission(user) for storage in localfiles_storage)
            
        wsi_logger.debug(f'Permission check: {time.time() - perm_start:.4f}s, has_permission={user_has_permissions}')
        
        # Log file existence
        if not os.path.exists(full_path):
            wsi_logger.debug(f'File not found: {full_path}')
            return HttpResponseNotFound()
        elif not user_has_permissions:
            wsi_logger.debug(f'Permission denied for user: {user.email}')
            return HttpResponseNotFound()
        
        # Optimized WSI file handling
        if is_wsi:
            # Start timing WSI processing
            wsi_start = time.time()
            
            # Import SLIDE_CACHE here to avoid circular imports
            from .wsi_optimizations import SLIDE_CACHE
            wsi_logger.debug(f'Import modules: {time.time() - wsi_start:.4f}s')
            
            # Get the slide from cache or load it
            cache_start = time.time()
            try:
                # Check if we have a cache hit before accessing
                cache_hit = full_path in SLIDE_CACHE._cache
                
                # Get the slide (either from cache or load it)
                dz = SLIDE_CACHE.get(full_path)
                cache_time = time.time() - cache_start
                
                # Log cache access details
                cache_size = len(SLIDE_CACHE._cache)
                cache_max = SLIDE_CACHE.cache_size
                wsi_logger.info(f'Slide cache access: time={cache_time:.4f}s, hit={cache_hit}, size={cache_size}/{cache_max}')
            except Exception as e:
                wsi_logger.error(f"Error loading file {full_path}: {e}")
                return HttpResponseNotFound()
                
            # Serve a specific tile if level, col, and row are provided
            if level and col and row:
                try:
                    level = int(level)
                    col = int(col)
                    row = int(row)
                    wsi_logger.debug(f'Parsing tile parameters: level={level}, col={col}, row={row}')
                except ValueError:
                    wsi_logger.error(f'Invalid tile parameters: level={level}, col={col}, row={row}')
                    return HttpResponseForbidden('Invalid level, col, or row parameter')

                try:
                    # Start timing tile extraction
                    tile_start = time.time()
                    
                    # Get the tile bytes directly (optimized for transfer)
                    # Use quality 75 for JPEG, matches server.py settings
                    tile_bytes = dz.get_tile_bytes(level, (col, row), format='jpeg', quality=75)
                    
                    # Log tile extraction time
                    tile_time = time.time() - tile_start
                    
                    # Return the tile with proper content type
                    total_time = time.time() - api_start
                    cache_hit = 'hit' if full_path in SLIDE_CACHE._cache else 'miss'
                    wsi_logger.info(f'Tile served: path={full_path}, level={level}, col={col}, row={row}, cache={cache_hit}, tile_time={tile_time:.4f}s, total_time={total_time:.4f}s')
                    
                    # Print a performance summary to make it easy to spot slow operations
                    wsi_logger.info(f'WSI PERFORMANCE SUMMARY - Tile: cache={cache_hit}, tile_extraction={tile_time:.4f}s, total={total_time:.4f}s')
                    
                    return HttpResponse(tile_bytes, content_type='image/jpeg')
                except Exception as e:
                    wsi_logger.error(f"Error getting tile for {full_path} at level {level}, col={col}, row={row}: {e}")
                    return HttpResponseNotFound()
            else:
                # Return DZI XML for the WSI file
                try:
                    # Start timing DZI generation
                    dzi_start = time.time()
                    
                    dzi_xml = dz.get_dzi(format='jpeg')
                    
                    # Log DZI generation time
                    dzi_time = time.time() - dzi_start
                    total_time = time.time() - api_start
                    cache_hit = 'hit' if full_path in SLIDE_CACHE._cache else 'miss'
                    
                    wsi_logger.info(f'DZI served: path={full_path}, cache={cache_hit}, dzi_time={dzi_time:.4f}s, total_time={total_time:.4f}s')
                    
                    # Print a performance summary
                    wsi_logger.info(f'WSI PERFORMANCE SUMMARY - DZI: cache={cache_hit}, generation={dzi_time:.4f}s, total={total_time:.4f}s')
                    
                    return HttpResponse(dzi_xml, content_type='application/xml')
                except Exception as e:
                    wsi_logger.error(f"Error getting DZI for {full_path}: {e}")
                    return HttpResponseNotFound()
        
        # If the file is not a WSI file, serve it as a regular file
        if user_has_permissions and os.path.exists(full_path):
            # Start timing regular file serving
            file_start = time.time()
            
            content_type, encoding = mimetypes.guess_type(str(full_path))
            content_type = content_type or 'application/octet-stream'
            
            # Log file serving time
            file_time = time.time() - file_start
            total_time = time.time() - api_start
            wsi_logger.info(f'Regular file served: path={full_path}, content_type={content_type}, file_time={file_time:.4f}s, total_time={total_time:.4f}s')
            
            # Print a performance summary for comparison
            wsi_logger.info(f'WSI PERFORMANCE SUMMARY - Regular file: size={os.path.getsize(full_path)}, file_time={file_time:.4f}s, total={total_time:.4f}s')
            
            return RangedFileResponse(request, open(full_path, mode='rb'), content_type)
        else:
            return HttpResponseNotFound()

    # Log total time for rejected requests
    wsi_logger.info(f'Request rejected: total_time={time.time() - api_start:.4f}s')
    return HttpResponseForbidden()


def static_file_with_host_resolver(path_on_disk, content_type):
    """Load any file, replace {{HOSTNAME}} => settings.HOSTNAME, send it as http response"""
    path_on_disk = os.path.join(os.path.dirname(__file__), path_on_disk)

    def serve_file(request):
        with open(path_on_disk, 'r') as f:
            body = f.read()
            body = body.replace('{{HOSTNAME}}', settings.HOSTNAME)

            out = io.StringIO()
            out.write(body)
            out.seek(0)

            wrapper = FileWrapper(out)
            response = HttpResponse(wrapper, content_type=content_type)
            response['Content-Length'] = len(body)
            return response

    return serve_file


def feature_flags(request):
    user = request.user
    if not user.is_authenticated:
        return HttpResponseForbidden()

    flags = all_flags(request.user)
    flags['$system'] = {
        'FEATURE_FLAGS_DEFAULT_VALUE': settings.FEATURE_FLAGS_DEFAULT_VALUE,
        'FEATURE_FLAGS_FROM_FILE': settings.FEATURE_FLAGS_FROM_FILE,
        'FEATURE_FLAGS_FILE': get_feature_file_path(),
        'VERSION_EDITION': settings.VERSION_EDITION,
        'CLOUD_INSTANCE': settings.CLOUD_INSTANCE if hasattr(settings, 'CLOUD_INSTANCE') else None,
    }

    return HttpResponse('<pre>' + json.dumps(flags, indent=4) + '</pre>', status=200)


@csrf_exempt
@require_http_methods(['POST', 'GET'])
def collect_metrics(request):
    """Lightweight endpoint to collect usage metrics from the frontend only when COLLECT_ANALYTICS is enabled"""
    return HttpResponse(status=204)
