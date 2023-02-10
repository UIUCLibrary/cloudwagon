import pytest
import requests


@pytest.mark.integration
def test_api_info(request):
    server_url = request.config.getoption("--server-url")
    res = requests.get(url=f"{server_url}/api")
    assert res.status_code == 200, res.text
