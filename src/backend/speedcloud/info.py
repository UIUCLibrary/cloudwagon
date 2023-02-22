import pkg_resources


def get_version() -> str:
    try:
        version = pkg_resources.get_distribution(__package__).version
        return version
    except pkg_resources.DistributionNotFound:
        return "NA"
