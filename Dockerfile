FROM python:3.9
COPY requirements.txt requirements.txt
ARG PIP_EXTRA_INDEX_URL
RUN --mount=type=secret,id=netrc,dst=/root/.netrc \
    pip install -r requirements.txt -v
