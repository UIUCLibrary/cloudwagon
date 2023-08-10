"""Log."""

import logging

formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

default_handler = logging.StreamHandler()
default_handler.setFormatter(formatter)
