# syntax = docker/dockerfile:1.2

ARG BASE_IMAGE=python:3.10
FROM ${BASE_IMAGE} as builder
COPY ../Speedwagon ./Speedwagon/
ARG PIP_EXTRA_INDEX_URL
ARG PIP_INDEX_URL
ARG CONAN_USER_HOME=/conan
COPY requirements.txt requirements.txt
COPY Speedwagon/requirements.txt Speedwagon/requirements.txt

RUN --mount=type=cache,id=custom-pip,target=/root/.cache/pip --mount=type=cache,id=conan-cache,target={CONAN_USER_HOME} --mount=type=secret,id=netrc,dst=/root/.netrc \
    pip wheel -r requirements.txt -w /wheels

COPY backend/speedcloud speedcloud/
COPY backend/pyproject.toml ./
RUN --mount=type=cache,id=custom-pip,target=/root/.cache/pip --mount=type=cache,id=conan-cache,target={CONAN_USER_HOME} --mount=type=secret,id=netrc,dst=/root/.netrc \
    pip install build && \
    python -m build Speedwagon --outdir /dist/ && \
    python -m build --outdir /dist/


FROM ${BASE_IMAGE}
COPY requirements.txt requirements.txt
COPY Speedwagon/requirements.txt Speedwagon/requirements.txt
#COPY backend/speedcloud/ speedcloud/

ARG PIP_EXTRA_INDEX_URL
ARG PIP_INDEX_URL

COPY --from=builder /wheels/*.whl /wheels/
RUN --mount=type=cache,id=custom-pip,target=/root/.cache/pip --mount=type=secret,id=netrc,dst=/root/.netrc \
    pip install -r requirements.txt -v --find-links=/wheels && \
    pip install pytest

COPY --from=builder /dist/*.whl dist/
RUN pip install dist/speedwagon-*.whl
RUN pip install dist/speedcloud-*.whl
WORKDIR /opt/speedcloud
RUN mkdir -p /opt/speedcloud/data/
COPY backend/extra/docker/docker_config.toml /etc/speedcloud/config.toml
COPY backend/extra/docker/log_info.yaml /etc/speedcloud/log_config.yaml
CMD ["uvicorn", "speedcloud:app", "--host", "0.0.0.0", "--port", "80", "--log-config", "/etc/speedcloud/log_config.yaml"]
