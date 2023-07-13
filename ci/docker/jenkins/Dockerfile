ARG PYTHON_VERSION="3.11"
FROM python:${PYTHON_VERSION} as base
RUN apt-get update && \
    apt-get install --no-install-recommends -y nodejs npm && \
    rm -rf  /root/.cache
RUN npm cache clean -f && \
    npm install -g n && \
    n stable

FROM base as hadolint_installer
RUN apt-get update && apt-get install --no-install-recommends -y wget && \
    rm -rf  /root/.cache
RUN wget --progress=dot:giga -O /bin/hadolint https://github.com/hadolint/hadolint/releases/download/v2.12.0/hadolint-Linux-x86_64 && \
    chmod +x /bin/hadolint && \
    hadolint --version

FROM base
ARG PIP_EXTRA_INDEX_URL
ARG PIP_TRUSTED_HOST
ARG PIP_INDEX_URL
COPY --from=hadolint_installer /bin/hadolint /bin/hadolint
RUN chmod +x /bin/hadolint &&  \
    hadolint --version
COPY requirements-ci.txt /tmp/python_requirements/requirements-ci.txt
COPY requirements/ /tmp/python_requirements/requirements/
RUN python3 -m pip install --no-cache-dir -r /tmp/python_requirements/requirements-ci.txt
