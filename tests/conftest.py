import pytest
def pytest_addoption(parser):
    parser.addoption(
        "--server-url", action="store", help="my option: type1 or type2"
    )

def pytest_collection_modifyitems(config, items):
    if config.getoption("--server-url"):
        return
    skip_slow = pytest.mark.skip(reason="integration")
    for item in items:
        if "integration" in item.keywords:
            item.add_marker(skip_slow)
