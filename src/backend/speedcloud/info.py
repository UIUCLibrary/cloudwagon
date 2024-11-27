"""info.

Get basic info about the verison of speedcloud running.
"""
from importlib.metadata import version, PackageNotFoundError


def get_version() -> str:
    """Get version of current running application."""
    try:
        return version(__package__)
    except PackageNotFoundError:
        return "NA"
