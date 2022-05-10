# syntax = docker/dockerfile:1.2

FROM python:3.9
COPY requirements.txt requirements.txt
ARG PIP_EXTRA_INDEX_URL
ARG PIP_CACHE_DIR=/var/cache/buildkit/pip

RUN --mount=type=cache,target=${PIP_CACHE_DIR} --mount=type=secret,id=netrc,dst=/root/.netrc \
    pip install -r requirements.txt -v
