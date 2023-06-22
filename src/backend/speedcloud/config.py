from functools import lru_cache
import os
from typing import List, Dict, Any, Optional, Callable
from typing_extensions import Protocol
import logging
import tempfile
from pydantic import BaseSettings
import tomlkit

ENVIRONMENT_NAME_SPEEDCLOUD_STORAGE = 'SPEEDCLOUD_STORAGE'

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    storage: str


search_locations: List[str] = [
    os.getcwd(),
    os.path.join("/", "opt", "etc", "speedcloud"),
    os.path.join("/", "etc", "speedcloud"),
]


def read_settings(config_file: str) -> Settings:
    logger.debug(f'Using config file "{config_file}".')

    with open(config_file, "r") as handel:
        data: Dict[str, Any] = tomlkit.parse(handel.read())

    return Settings(storage=data["main"]["storage_path"])


@lru_cache()
def get_settings() -> Settings:
    try:
        config_file = find_config_file(search_paths=search_locations)
    except FileNotFoundError:
        if ENVIRONMENT_NAME_SPEEDCLOUD_STORAGE in os.environ:
            storage_path = os.environ[ENVIRONMENT_NAME_SPEEDCLOUD_STORAGE]
        else:
            temp_root = tempfile.gettempdir()
            temp_storage = os.path.join(temp_root, "speedcloud")
            storage_path = temp_storage
        if not os.path.exists(storage_path):
            os.makedirs(storage_path)
        return Settings(storage=storage_path)
    return read_settings(config_file)


def find_config_file(
    config_file_name="config.toml", search_paths: Optional[List[str]] = None
) -> str:
    for location in search_paths or search_locations:
        candidate = os.path.join(location, config_file_name)
        if os.path.exists(candidate):
            return candidate

    raise FileNotFoundError("No config file located")


class InputPrompt(Protocol):
    def __call__(self, prompt: str, required: bool = False) -> str:
        ...


def input_prompt(prompt: str, required: bool = False) -> str:
    while True:
        response = input(prompt)
        if required and response == "":
            continue
        return response


def generate_default_toml_config(
    prompt_for_input: InputPrompt = input_prompt,
) -> str:
    main = tomlkit.table()
    doc = tomlkit.document()
    doc["main"] = main
    main.add(
        "storage_path",
        prompt_for_input("root path to use for files: ", required=True),
    )
    main["storage_path"].comment(
        "storage_path is the root path to use for files read and written to "
        "by the workflows. This is a required field."
    )
    return tomlkit.dumps(doc)


def write_default_config_file(
    file_name, config_file_strategy: Callable[[], str]
) -> None:
    text = config_file_strategy()
    with open(file_name, "w", encoding="utf-8") as file_handel:
        file_handel.write(text)
