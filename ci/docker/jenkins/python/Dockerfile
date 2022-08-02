FROM ubuntu:22.04
RUN apt update && apt install -y python3-pip cmake nodejs npm  curl
RUN npm cache clean -f && \
    npm install -g n && \
    n stable
ARG PIP_EXTRA_INDEX_URL
ARG PIP_TRUSTED_HOST
ARG PIP_INDEX_URL
COPY requirements.txt requirements-ci.txt /tmp/requirements/
RUN python3 -m pip install -r /tmp/requirements/requirements-ci.txt
