"""info.

Get basic info about the verison of speedcloud running.
"""
import pkg_resources


def get_version() -> str:
    """Get version of current running application."""
    try:
        version = pkg_resources.get_distribution(__package__).version
        return version
    except pkg_resources.DistributionNotFound:
        return "NA"
