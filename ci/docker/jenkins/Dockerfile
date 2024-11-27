FROM python:latest AS base
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
