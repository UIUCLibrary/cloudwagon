ARG PYTHON_VERSION="3.11"
ARG PIPX_HOME=/pipx

FROM python:${PYTHON_VERSION} AS base
RUN apt-get update && \
    apt-get install --no-install-recommends -y nodejs npm && \
    rm -rf  /root/.cache
RUN npm cache clean -f && \
    npm install -g n && \
    n stable


FROM base AS hadolint_installer
RUN apt-get update && apt-get install --no-install-recommends -y wget && \
    rm -rf  /root/.cache
RUN wget --progress=dot:giga -O /bin/hadolint https://github.com/hadolint/hadolint/releases/download/v2.12.0/hadolint-Linux-x86_64 && \
    chmod +x /bin/hadolint && \
    hadolint --version
#==============================================================================

FROM base

COPY --from=hadolint_installer /bin/hadolint /bin/hadolint
RUN chmod +x /bin/hadolint &&  \
    hadolint --version
ARG PIP_EXTRA_INDEX_URL
ARG PIP_TRUSTED_HOST
ARG PIP_INDEX_URL
COPY requirements-ci.txt /tmp/python_requirements/requirements-ci.txt
COPY requirements/ /tmp/python_requirements/requirements/
RUN python3 -m pip install --no-cache-dir -r /tmp/python_requirements/requirements-ci.txt

ARG PIPX_HOME
ENV PIPX_HOME=${PIPX_HOME}
ENV PIPX_BIN_DIR=${PIPX_HOME}/bin
RUN pip3 install --no-cache-dir pipx && \
    pipx ensurepath && \
    mkdir -p $PIPX_HOME  && chmod -R 777 $PIPX_HOME

RUN PIPX_HOME=/opt/pipx PIPX_BIN_DIR=/usr/local/bin pipx install pip-audit
