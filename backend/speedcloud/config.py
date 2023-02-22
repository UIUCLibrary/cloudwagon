from functools import lru_cache
import os
from typing import List, Dict, Any, Optional
import logging

from pydantic import BaseSettings
import tomlkit
logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    storage: str


search_locations: List[str] = [
        os.getcwd(),
        os.path.join("/", "opt", "etc", "speedcloud"),
        os.path.join("/", "etc", "speedcloud")
]


def read_settings(config_file: str) -> Settings:
    logger.debug(f'Using config file "{config_file}".')

    with open(config_file, "r") as handel:
        data: Dict[str, Any] = tomlkit.parse(handel.read())

    return Settings(storage=data['main']['storage_path'])


@lru_cache()
def get_settings() -> Settings:
    config_file = find_config_file(search_paths=search_locations)
    return read_settings(config_file)


def find_config_file(
        config_file_name="config.toml",
        search_paths: Optional[List[str]] = None
) -> str:

    for location in search_paths or search_locations:
        candidate = os.path.join(location, config_file_name)
        if os.path.exists(candidate):
            return candidate

    raise FileNotFoundError("No config file located")
