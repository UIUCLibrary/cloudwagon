ARG PIP_CACHE_DIR=/.cache/pip

FROM ubuntu:20.04 AS base
COPY ci/docker/tox/linux/apt-packages.txt /tmp/
RUN apt-get update && \
    apt-get install -y --no-install-recommends software-properties-common && \
    add-apt-repository ppa:deadsnakes/ppa && \
    apt-get update && \
    < /tmp/apt-packages.txt xargs apt-get install -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

FROM base
ARG PIP_CACHE_DIR
ARG PIP_EXTRA_INDEX_URL
ARG PIP_INDEX_URL
RUN mkdir -p ${PIP_CACHE_DIR} && chmod -R 777 ${PIP_CACHE_DIR} && \
    mkdir -p /.local/share && chmod -R 777 /.local/share

RUN python3 -m pip install --no-cache-dir pip --upgrade && \
    python3 -m pip install --no-cache-dir wheel tox

WORKDIR /src
ENV PIP_CACHE_DIR = ${PIP_CACHE_DIR}
ENV PIP_EXTRA_INDEX_URL = ${PIP_EXTRA_INDEX_URL}
CMD ["tox", "--workdir", "/tmp/tox", "--recreate"]
