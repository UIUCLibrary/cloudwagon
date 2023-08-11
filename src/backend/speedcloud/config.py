"""Config."""

from functools import lru_cache
import os
from typing import List, Dict, Any, Optional, Callable
import logging
import tempfile
from typing_extensions import Protocol
from pydantic_settings import BaseSettings
import tomlkit
from speedcloud.exceptions import SpeedCloudException

__all__ = [
    "Settings",
    "get_settings",
    "generate_default_toml_config",
    "write_default_config_file",
    "initialize_app_from_settings"
]

ENVIRONMENT_NAME_SPEEDCLOUD_STORAGE = "SPEEDCLOUD_STORAGE"

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class Settings(BaseSettings):  # pylint: disable=too-few-public-methods
    """Application settings."""
    storage: str
    whitelisted_workflows: Optional[List[str]] = None


config_file_search_locations: List[str] = [
    os.getcwd(),
    os.path.join("/", "opt", "etc", "speedcloud"),
    os.path.join("/", "etc", "speedcloud"),
]


def initialize_app_from_settings(settings: Settings) -> None:

    if not os.path.exists(settings.storage):
        os.makedirs(settings.storage)
        logger.debug("created new folder %s", settings.storage)


def read_settings_file(config_file: str) -> Settings:
    logger.debug('Using config file "%s".', config_file)

    with open(config_file, "r", encoding="utf-8") as handel:
        data: Dict[str, Any] = tomlkit.parse(handel.read())
    return Settings(
        storage=data["main"]["storage_path"],
    )


def get_settings_from_file(
        file_locator: Callable[[], str],
        reader: Callable[[str], Settings]
) -> Optional[Settings]:
    try:
        config_file = file_locator()
        print(f"Found config file: {config_file}")
        return reader(config_file)
    except FileNotFoundError:
        return None


def get_settings_from_env_var() -> Optional[Settings]:
    if ENVIRONMENT_NAME_SPEEDCLOUD_STORAGE not in os.environ:
        return None
    print("Found config using environment variable")
    return Settings(storage=os.environ[ENVIRONMENT_NAME_SPEEDCLOUD_STORAGE])


def create_temp_settings(temp_root: str) -> Optional[Settings]:
    storage_path = os.path.join(temp_root, "speedcloud")
    logger.debug("using temporary directory for storage: %s", storage_path)
    return Settings(storage=storage_path)


def resolve_settings(resolve_order: List[Callable[[], Optional[Settings]]]):
    """Resolve the application settings.

    This function run the function strategies in the order provided by the
    resolve order, the first callable function that returns a value other than
    None will be used. Once that valid strategy is determined, the rest of the
    strategies in this list will not be attempted.
    """
    for settings_strategy in resolve_order:
        results = settings_strategy()
        if results is not None:
            return results
    raise SpeedCloudException("No way to resolve settings")


@lru_cache()
def get_settings() -> Settings:
    """Get application settings."""
    resolve_order = [
        lambda: get_settings_from_file(
            file_locator=lambda: find_config_file(
                search_paths=config_file_search_locations
            ),
            reader=read_settings_file
        ),
        get_settings_from_env_var,
        lambda: create_temp_settings(tempfile.gettempdir())
    ]
    return resolve_settings(resolve_order)


def find_config_file(
    config_file_name="config.toml", search_paths: Optional[List[str]] = None
) -> str:
    for location in search_paths or config_file_search_locations:
        candidate = os.path.join(location, config_file_name)
        if os.path.exists(candidate):
            return candidate

    raise FileNotFoundError("No config file located")


class InputPrompt(Protocol):  # pylint: disable=too-few-public-methods
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
    """Generate the text of a default toml config file.

    Args:
        prompt_for_input: user prompt for getting a response from the user.

    Returns: Returns string containing the config file contents.

    """
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
    """Write a default config file to the file system.

    Args:
        file_name: file name on file system
        config_file_strategy: config file generator function that builds
         the file contents as a string.
    """
    text = config_file_strategy()
    with open(file_name, "w", encoding="utf-8") as file_handel:
        file_handel.write(text)
