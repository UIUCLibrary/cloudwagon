import argparse
import logging

from fastapi import FastAPI
from fastapi.middleware.wsgi import WSGIMiddleware

from speedcloud.site import site
from speedcloud.api import api

logger = logging.getLogger(__name__)

app = FastAPI(docs_url="/api")
app.include_router(api)
app.mount("/", WSGIMiddleware(site))


def _get_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8001)
    return parser


def main() -> None:
    import uvicorn
    parser = _get_arg_parser()
    args = parser.parse_args()
    logger.warning(
        "IMPORTANT: This is not a production mode! "
        "Use this mode for debugging only."
    )
    uvicorn.run(app, host='0.0.0.0', port=args.port, log_level="debug")


if __name__ == '__main__':
    main()
