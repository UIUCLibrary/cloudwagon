import argparse
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from speedcloud.exceptions import CloudWagonException

from speedcloud.api import api
from speedcloud import config

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
    allow_headers=["*"],
)


app.include_router(api)
# app.mount("/", WSGIMiddleware(site))


def handel_cloudwagon_exceptions(request: Request, ext: CloudWagonException):
    return JSONResponse(status_code=400, content={})


app.add_exception_handler(
    CloudWagonException, handler=handel_cloudwagon_exceptions
)


def create_default_config_file(args):
    config.write_default_config_file(
        "config.toml", config_file_strategy=config.generate_default_toml_config
    )


def run_debug(args):
    import uvicorn  # pylint: disable=import-outside-toplevel

    logger.warning(
        "IMPORTANT: This is not a production mode! "
        "Use this mode for debugging only."
    )
    uvicorn.run(app, host="0.0.0.0", port=args.port, log_level="debug")


def get_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.set_defaults(func=run_debug)
    subparsers = parser.add_subparsers(help="commands")

    create_default_config_parser = subparsers.add_parser(
        "create-default-config", help="create default config file"
    )
    create_default_config_parser.set_defaults(func=create_default_config_file)

    parser.add_argument("--port", type=int, default=8001)
    return parser


def main() -> None:
    parser = get_arg_parser()
    args = parser.parse_args()
    args.func(args)
    exit(0)


if __name__ == "__main__":
    main()
