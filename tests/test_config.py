import os.path
from unittest.mock import Mock, patch, mock_open

import pytest

import speedcloud.config
import speedcloud.exceptions


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


def test_get_settings_from_file_not_found():
    assert speedcloud.config.get_settings_from_file(
        file_locator=Mock(side_effect=FileNotFoundError),
        reader=Mock()
    ) is None


def test_get_settings_from_file():
    assert speedcloud.config.get_settings_from_file(
        file_locator=Mock(return_value="somefile"),
        reader=Mock(
            return_value=speedcloud.config.Settings(storage="something")
        )
    ) is not None


def test_find_config_file_missing_raises(monkeypatch):
    expected_file = os.path.join('.', 'dummy.toml')
    monkeypatch.setattr(
        speedcloud.config.os.path,
        'exists', lambda path: path != expected_file
    )
    with pytest.raises(FileNotFoundError):
        speedcloud.config.find_config_file(
            'dummy.toml',
            search_paths=['.'])


def test_get_settings_from_env_var(monkeypatch):
    with monkeypatch.context() as ctx:
        ctx.setenv(
            name=speedcloud.config.ENVIRONMENT_NAME_SPEEDCLOUD_STORAGE,
            value="somepath"
        )
        assert speedcloud.config.get_settings_from_env_var() is not None


def test_get_settings_from_env_var_not_set(monkeypatch):
    with monkeypatch.context() as ctx:
        ctx.delenv(
            name=speedcloud.config.ENVIRONMENT_NAME_SPEEDCLOUD_STORAGE,
            raising=False
        )
        assert speedcloud.config.get_settings_from_env_var() is None


def test_create_temp_settings(monkeypatch):
    makedirs = Mock()
    monkeypatch.setattr(speedcloud.config.os, "makedirs", makedirs)
    assert speedcloud.config.create_temp_settings("somepath").storage


def test_read_settings_file():
    data = """[main]
storage_path="someplace"
    """
    with patch("speedcloud.config.open", mock_open(read_data=data)):
        assert speedcloud.config.read_settings_file("").storage == "someplace"


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

def test_resolve_settings_calls_only_first_valid():
    first_test = Mock(return_value=speedcloud.config.Settings(storage=''))
    second_test = Mock(return_value=speedcloud.config.Settings(storage=''))
    speedcloud.config.resolve_settings(
        [
            first_test,
            second_test
        ]
    )

    assert all(
        [first_test.called is True, second_test.called is False]
    )

def test_resolve_settings_calls_until_one_returns_valid_data():
    first_test = Mock(return_value=None)
    second_test = Mock(return_value=speedcloud.config.Settings(storage=''))
    speedcloud.config.resolve_settings(
        [
            first_test,
            second_test
        ]
    )

    assert all(
        [first_test.called is True, second_test.called is True]
    )


def test_resolve_settings_raises_if_no_valid_setting_found():
    first_test = Mock(return_value=None)
    second_test = Mock(return_value=None)
    with pytest.raises(speedcloud.exceptions.SpeedCloudException):
        speedcloud.config.resolve_settings(
            [
                first_test,
                second_test
            ]
        )
