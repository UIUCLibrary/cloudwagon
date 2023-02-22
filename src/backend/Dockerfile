# syntax = docker/dockerfile:1.2

ARG BASE_IMAGE=python:3.10
FROM ${BASE_IMAGE} as builder
#COPY ../Speedwagon ./Speedwagon/
ARG PIP_EXTRA_INDEX_URL
ARG PIP_INDEX_URL
COPY requirements.txt /tmp/requirements.txt
#COPY Speedwagon/requirements.txt Speedwagon/requirements.txt

RUN --mount=type=cache,id=custom-pip,target=/root/.cache/pip --mount=type=secret,id=netrc,dst=/root/.netrc \
    pip wheel --no-cache-dir -r /tmp/requirements.txt -w /wheels

COPY src/backend/speedcloud /tmp/project/src/backend/speedcloud/
COPY pyproject.toml /tmp/project
RUN --mount=type=cache,id=custom-pip,target=/root/.cache/pip --mount=type=secret,id=netrc,dst=/root/.netrc \
    pip install --no-cache-dir build && \
    python -m build /tmp/project --outdir /wheels/


FROM ${BASE_IMAGE}
COPY requirements.txt /tmp/requirements.txt

ARG PIP_EXTRA_INDEX_URL
ARG PIP_INDEX_URL

COPY --from=builder /wheels/*.whl /wheels/
RUN --mount=type=cache,id=custom-pip,target=/root/.cache/pip --mount=type=secret,id=netrc,dst=/root/.netrc \
    pip install --no-cache-dir -r /tmp/requirements.txt -v --find-links=/wheels && \
    pip install --no-cache-dir --find-links=/wheels speedcloud

WORKDIR /opt/speedcloud
RUN mkdir -p /opt/speedcloud/data/
COPY src/backend/extra/docker/docker_config.toml /etc/speedcloud/config.toml
COPY src/backend/extra/docker/log_info.yaml /etc/speedcloud/log_config.yaml
EXPOSE 8000
CMD ["uvicorn", "speedcloud:app", "--host", "0.0.0.0", "--port", "80", "--log-config", "/etc/speedcloud/log_config.yaml"]
