# syntax=docker/dockerfile:1
ARG NODE_VERSION=18
ARG PYTHON_VERSION=3.11
ARG POETRY_VERSION=1.8.4
ARG UWSGI_VERSION=2.0.28
ARG UWSGITOP_VERSION=0.12

################################ Overview

# This Dockerfile builds a Label Studio environment.
# It consists of three main stages:
# 1. "frontend-builder" - Compiles the frontend assets using Node.
# 2. "base-image" - Prepares common env variables and installs Poetry.
# 3. "frontend-version-generator" - Generates version files for frontend sources.
# 4. "venv-builder" - Prepares the virtualenv environment.
# 5. "prod" - Creates the final production image with the Label Studio Enterprise, Nginx, and other dependencies.

################################ Stage: frontend-builder (build frontend assets)
FROM --platform=${BUILDPLATFORM} node:${NODE_VERSION} AS frontend-builder
ENV BUILD_NO_SERVER=true \
    BUILD_NO_HASH=true \
    BUILD_NO_CHUNKS=true \
    BUILD_MODULE=true \
    YARN_CACHE_FOLDER=/root/web/.yarn \
    NX_CACHE_DIRECTORY=/root/web/.nx \
    NODE_ENV=production

WORKDIR /label-studio/web

# Fix Docker Arm64 Build
RUN yarn config set registry https://registry.npmjs.org/
RUN yarn config set network-timeout 1200000 # HTTP timeout used when downloading packages, set to 20 minutes

COPY web/package.json .
COPY web/yarn.lock .
COPY web/tools tools
RUN --mount=type=cache,target=${YARN_CACHE_FOLDER},sharing=locked \
    --mount=type=cache,target=${NX_CACHE_DIRECTORY},sharing=locked \
    yarn install --prefer-offline --no-progress --pure-lockfile --frozen-lockfile --ignore-engines --non-interactive --production=false

COPY web .
COPY pyproject.toml ../pyproject.toml
RUN --mount=type=cache,target=${YARN_CACHE_FOLDER},sharing=locked \
    --mount=type=cache,target=${NX_CACHE_DIRECTORY},sharing=locked \
    yarn run build

################################ Stage: base image
# Creating a python base with shared environment variables
FROM python:${PYTHON_VERSION}-slim AS python-base
ARG POETRY_VERSION
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100 \
    PIP_CACHE_DIR="/.cache" \
    POETRY_HOME="/opt/poetry" \
    POETRY_CACHE_DIR="/.poetry-cache" \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    VENV_PATH="/label-studio/.venv"

ENV PATH="$POETRY_HOME/bin:$VENV_PATH/bin:$PATH"

RUN --mount=type=cache,target=${PIP_CACHE_DIR},sharing=locked \
    pip install poetry==${POETRY_VERSION}

################################ Stage: frontend-version-generator
FROM frontend-builder AS frontend-version-generator
RUN --mount=type=cache,target=${YARN_CACHE_FOLDER},sharing=locked \
    --mount=type=cache,target=${NX_CACHE_DIRECTORY},sharing=locked \
    --mount=type=bind,source=.git,target=../.git \
    yarn version:libs

################################ Stage: venv-builder (prepare the virtualenv)
FROM python-base AS venv-builder
ARG PYTHON_VERSION
ARG VENV_PATH
ARG UWSGI_VERSION
ARG UWSGITOP_VERSION

RUN --mount=type=cache,target="/var/cache/apt",sharing=locked \
    --mount=type=cache,target="/var/lib/apt/lists",sharing=locked \
    set -eux; \
    apt-get update; \
    apt-get install --no-install-recommends -y \
            gcc python3-dev; \
    apt-get autoremove -y

WORKDIR /label-studio

## Starting from this line all packages will be installed in $VENV_PATH

# Copy dependency files
COPY pyproject.toml poetry.lock README.md ./

# Install dependencies without dev packages
RUN --mount=type=cache,target=${POETRY_CACHE_DIR} \
    poetry check --lock && poetry install --no-root --without test

# Install middleware components
RUN --mount=type=cache,target=${PIP_CACHE_DIR},sharing=locked \
    pip install uwsgi==${UWSGI_VERSION} uwsgitop==${UWSGITOP_VERSION}

################################### Stage: prod
FROM python-base AS production

ENV LS_DIR=/label-studio \
    DJANGO_SETTINGS_MODULE=core.settings.label_studio \
    LABEL_STUDIO_BASE_DATA_DIR=/label-studio/data \
    OPT_DIR=/opt/heartex/instance-data/etc \
    HOME=$LS_DIR

WORKDIR $LS_DIR

# incapsulate nginx install & configure to a single layer
RUN --mount=type=cache,target="/var/cache/apt",sharing=locked \
    --mount=type=cache,target="/var/lib/apt/lists",sharing=locked \
    set -eux; \
    apt-get update; \
    apt-get upgrade -y; \
    apt-get install --no-install-recommends -y libexpat1 \
        nginx curl; \
    apt-get autoremove -y

RUN set -eux; \
    mkdir -p $LS_DIR $LABEL_STUDIO_BASE_DATA_DIR $OPT_DIR && \
    chown -R 1001:0 $LS_DIR $LABEL_STUDIO_BASE_DATA_DIR $OPT_DIR /var/log/nginx /etc/nginx

COPY --chown=1001:0 deploy/default.conf /etc/nginx/nginx.conf

# Copy essential files for installing Label Studio and its dependencies
COPY --chown=1001:0 pyproject.toml .
COPY --chown=1001:0 poetry.lock .
COPY --chown=1001:0 README.md .
COPY --chown=1001:0 LICENSE LICENSE
COPY --chown=1001:0 licenses licenses
COPY --chown=1001:0 label_studio label_studio
COPY --chown=1001:0 deploy deploy
# We need these files for security scanners
COPY --chown=1001:0 web/yarn.lock $LS_DIR//web/yarn.lock

COPY --chown=1001:0 --from=venv-builder               ${VENV_PATH}                                            ${VENV_PATH}
COPY --chown=1001:0 --from=frontend-builder           /label-studio/web/dist                                  $LS_DIR/web/dist
COPY --chown=1001:0 --from=frontend-version-generator /label-studio/web/dist/apps/labelstudio/version.json    $LS_DIR/web/dist/apps/labelstudio/version.json
COPY --chown=1001:0 --from=frontend-version-generator /label-studio/web/dist/libs/editor/version.json         $LS_DIR/web/dist/libs/editor/version.json
COPY --chown=1001:0 --from=frontend-version-generator /label-studio/web/dist/libs/datamanager/version.json    $LS_DIR/web/dist/libs/datamanager/version.json

USER 1001

# Install LS
RUN --mount=type=cache,target=$POETRY_CACHE_DIR \
    poetry install --only-root && \
    python3 label_studio/manage.py collectstatic --no-input

EXPOSE 8080

ENTRYPOINT ["./deploy/docker-entrypoint.sh"]
CMD ["label-studio"]
