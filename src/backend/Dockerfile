FROM python:3.11 AS baseimage

FROM baseimage

ARG PIP_EXTRA_INDEX_URL
ARG PIP_INDEX_URL
ARG UV_EXTRA_INDEX_URL
ARG UV_INDEX_URL

WORKDIR /opt/speedcloud
COPY pyproject.toml /opt/speedcloud/pyproject.toml
COPY src/backend/ /opt/speedcloud/src/backend/

RUN --mount=type=cache,id=pip-cache,target=/root/.cache/pip \
    --mount=type=cache,id=uv-cache,target=/root/.cache/uv \
    --mount=type=bind,source=pyproject.toml,target=/tmp/pyproject.toml \
    --mount=type=bind,source=uv.lock,target=/tmp/speedcloud/uv.lock \
    python -m venv venv && \
    venv/bin/pip install uv --disable-pip-version-check && \
    venv/bin/uv export --project=/tmp/speedcloud --group=deploy --format=requirements.txt > /opt/speedcloud/requirements.txt && \
    venv/bin/uv pip install --index-strategy unsafe-best-match --system -v -r /opt/speedcloud/requirements.txt . && \
    rm -rf venv

RUN mkdir -p /opt/speedcloud/data/
COPY src/backend/extra/docker/docker_config.toml /etc/speedcloud/config.toml
COPY src/backend/extra/docker/log_info.yaml /etc/speedcloud/log_config.yaml
EXPOSE 8000
CMD ["uvicorn", "speedcloud:app", "--host", "0.0.0.0", "--port", "80", "--log-config", "/etc/speedcloud/log_config.yaml"]
