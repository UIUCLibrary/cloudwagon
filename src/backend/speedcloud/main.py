import argparse
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .exceptions import CloudWagonException

from .api import api

origins = [
    "*"
    # "http://localhost:3000",
    # "localhost:3000"
]

logger = logging.getLogger(__name__)

app = FastAPI(docs_url="/")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(api)
# app.mount("/", WSGIMiddleware(site))


def handel_cloudwagon_exceptions(request: Request, ext: CloudWagonException):
    return JSONResponse(status_code=400, content={})


app.add_exception_handler(
    CloudWagonException,
    handler=handel_cloudwagon_exceptions
)


def _get_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8001)
    return parser


def main() -> None:
    import uvicorn  # pylint: disable=import-outside-toplevel
    parser = _get_arg_parser()
    args = parser.parse_args()
    logger.warning(
        "IMPORTANT: This is not a production mode! "
        "Use this mode for debugging only."
    )
    uvicorn.run(app, host='0.0.0.0', port=args.port, log_level="debug")


if __name__ == '__main__':
    main()
