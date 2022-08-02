import os.path

import speedcloud.config


def test_find_config_file(monkeypatch):
    expected_file = os.path.join('.', 'dummy.toml')
    monkeypatch.setattr(
        speedcloud.config.os.path,
        'exists', lambda path: path == expected_file
    )
    assert speedcloud.config.find_config_file(
        'dummy.toml',
        search_paths=['.']
    ) == expected_file
