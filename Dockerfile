# syntax = docker/dockerfile:1.2

FROM python:3.10
COPY Speedwagon ./Speedwagon/
COPY requirements.txt requirements.txt
RUN mkdir -p /.cache/pip && chmod 777 /.cache/pip
ARG PIP_EXTRA_INDEX_URL
ARG PIP_INDEX_URL
ARG CONAN_USER_HOME=/conan
COPY dist/ dist/
RUN --mount=type=cache,id=custom-pip,target=/root/.cache/pip pip cache list
RUN --mount=type=cache,id=custom-pip,target=/root/.cache/pip --mount=type=cache,id=conan-cache,target={CONAN_USER_HOME} --mount=type=secret,id=netrc,dst=/root/.netrc \
    pip install -r requirements.txt -v && \
    pip install pytest
COPY speedcloud/ speedcloud/
RUN pip install dist/speedwagon-*.whl
CMD python speedcloud/helloworld.py
