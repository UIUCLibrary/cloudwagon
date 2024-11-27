ARG HADOLINT_INSTALL_PATH=/opt/hadolint/hadolint
FROM python:latest AS base

RUN apt-get update && \
    apt-get install --no-install-recommends -y nodejs npm && \
    rm -rf  /root/.cache
RUN npm cache clean -f && \
    npm install -g n && \
    n stable


FROM base AS hadolint_installer
ARG HADOLINT_INSTALL_PATH
RUN case $(uname -m) in \
    x86_64) URL=https://github.com/hadolint/hadolint/releases/download/v2.12.0/hadolint-Linux-x86_64 ;; \
    aarch64) URL=https://github.com/hadolint/hadolint/releases/download/v2.12.0/hadolint-Linux-arm64 ;; \
    esac; \
    curl --create-dirs -sSLo ${HADOLINT_INSTALL_PATH} $URL && \
    ln -s ${HADOLINT_INSTALL_PATH} /bin/hadolint && \
    chmod +x ${HADOLINT_INSTALL_PATH} && \
    which hadolint && hadolint --version
#==============================================================================

FROM base
ARG HADOLINT_INSTALL_PATH
COPY --from=hadolint_installer ${HADOLINT_INSTALL_PATH} ${HADOLINT_INSTALL_PATH}
RUN chmod +x ${HADOLINT_INSTALL_PATH} &&  \
    ln -s ${HADOLINT_INSTALL_PATH} /bin/hadolint && \
    hadolint --version
