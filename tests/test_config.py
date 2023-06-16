import os.path
from unittest.mock import Mock, patch, mock_open

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

def test_generate_default_config(monkeypatch):
    file_name = "dummy.toml"
    config_generator = Mock(return_value="some data")
    m = mock_open()
    with patch("speedcloud.config.open", m):
        speedcloud.config.write_default_config_file(
            file_name,
            config_file_strategy=config_generator
        )
    handle = m()
    handle.write.assert_called_once_with('some data')

def test_generate_default_toml_config_has_main():
    def no_op(prompt, required=False):
        return ''
    assert "[main]" in speedcloud.config.generate_default_toml_config(
        prompt_for_input=no_op
    )