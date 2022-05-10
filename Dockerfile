# syntax = docker/dockerfile:1.2

FROM python:3.9
COPY requirements.txt requirements.txt
ARG PIP_EXTRA_INDEX_URL
ARG PIP_INDEX_URL
ENV PIP_CACHE_DIR=PIP_CACHE_DIR
RUN --mount=type=cache,id=custom-pip,target=/root/.cache/pip pip cache list
RUN --mount=type=cache,id=custom-pip,target=/root/.cache/pip --mount=type=secret,id=netrc,dst=/root/.netrc \
    pip install -r requirements.txt -v
