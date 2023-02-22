from unittest.mock import Mock

from speedcloud.api import storage

def test_create_directory(monkeypatch):
    mkdir = Mock()
    monkeypatch.setattr(storage.os, 'mkdir', mkdir)
    storage.create_directory('/', 'path')
    assert mkdir.called is True