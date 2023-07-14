ARG PYTHON_VERSION="3.11"
ARG SONAR_SCANNER_VERSION=4.8.0.2856
ARG SONAR_INSTALL_PATH=/opt/sonar
ARG SONAR_SCANNER_HOME=${SONAR_INSTALL_PATH}/${SONAR_SCANNER_VERSION}-linux
ARG SONAR_USER_HOME=${SONAR_INSTALL_PATH}/.sonar
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
#==============================================================================
FROM base as SONAR_BUILDER
RUN apt-get update && \
    apt-get install -y --no-install-recommends unzip
ARG SONAR_SCANNER_VERSION
ARG SONAR_INSTALL_PATH
ARG SONAR_USER_HOME
RUN curl --create-dirs -sSLo /tmp/sonar-scanner.zip \
        https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-${SONAR_SCANNER_VERSION}-linux.zip && \
    unzip -o /tmp/sonar-scanner.zip -d ${SONAR_INSTALL_PATH}/ && \
    rm /tmp/sonar-scanner.zip && \
    mkdir -p $SONAR_USER_HOME/cache && \
    chmod -R 777 "${SONAR_USER_HOME}" &&\
    ln -s ${SONAR_INSTALL_PATH}/sonar-scanner-${SONAR_SCANNER_VERSION}-linux/bin/sonar-scanner /usr/local/bin/sonar-scanner && \
    which sonar-scanner
FROM base

ARG SONAR_INSTALL_PATH
COPY --from=SONAR_BUILDER ${SONAR_INSTALL_PATH} "${SONAR_INSTALL_PATH}/"
ARG SONAR_SCANNER_VERSION
ARG SONAR_USER_HOME
RUN ln -s ${SONAR_INSTALL_PATH}/sonar-scanner-${SONAR_SCANNER_VERSION}-linux/bin/sonar-scanner /usr/local/bin/sonar-scanner && \
    which sonar-scanner && \
    mkdir -p $SONAR_USER_HOME/cache && \
    chmod -R 777 "${SONAR_USER_HOME}"
ENV SONAR_USER_HOME=${SONAR_USER_HOME}
COPY --from=hadolint_installer /bin/hadolint /bin/hadolint
RUN chmod +x /bin/hadolint &&  \
    hadolint --version
ARG PIP_EXTRA_INDEX_URL
ARG PIP_TRUSTED_HOST
ARG PIP_INDEX_URL
COPY requirements-ci.txt /tmp/python_requirements/requirements-ci.txt
COPY requirements/ /tmp/python_requirements/requirements/
RUN python3 -m pip install --no-cache-dir -r /tmp/python_requirements/requirements-ci.txt
