"""Main."""

import argparse
import logging
import sys

from speedcloud import config
from speedcloud.app import app

logger = logging.getLogger(__name__)


def create_default_config_file(args):
    """Generate default config file."""
    config.write_default_config_file(
        "config.toml", config_file_strategy=config.generate_default_toml_config
    )


def run_debug(args):
    """Run debug webserver."""
    import uvicorn  # pylint: disable=import-outside-toplevel

    logger.warning(
        "IMPORTANT: This is not a production mode! "
        "Use this mode for debugging only."
    )
    uvicorn.run(app, host="0.0.0.0", port=args.port, log_level="debug")


def get_arg_parser() -> argparse.ArgumentParser:
    """Get cli args parser."""
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
    """Run Speedcloud builtin webserver.

    This is for development or testing.  It is not intended for production.
    """
    parser = get_arg_parser()
    args = parser.parse_args()
    args.func(args)
    sys.exit(0)


if __name__ == "__main__":
    main()
