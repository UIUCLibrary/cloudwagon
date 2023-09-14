"""Storage.

Manage the file system storage for the application.

"""
import os
from typing import TypedDict, List, Optional

try:
    from typing import NotRequired
except ImportError:
    from typing_extensions import NotRequired


__all__ = [
    "is_within_valid_directory",
    "clear_files",
    "create_directory",
    "remove_path_from_storage",
]


def is_within_valid_directory(root: str, path: str) -> bool:
    """Check if a path is a valid path."""
    return os.path.commonpath([os.path.abspath(root)]) == os.path.commonpath(
        [os.path.abspath(root), os.path.abspath(path)]
    )


class PathContent(TypedDict):
    name: str
    path: NotRequired[str]
    type: str
    size: Optional[int]


def get_path_contents(path: str, starting: str) -> List[PathContent]:
    file_path = os.path.relpath(path, starting)
    file_path = "/" if file_path == "." else f"/{file_path}"
    paths: List[PathContent] = [
        {
            "name": ".",
            "path": os.path.normpath(os.path.join(file_path, ".")),
            "type": "Directory",
            "size": None,
        }
    ]
    if not is_within_valid_directory(path, starting):
        paths += [
            {
                "name": "..",
                "path": os.path.normpath(os.path.join(file_path, "..")),
                "type": "Directory",
                "size": None,
            }
        ]
    paths += [
        {
            "name": entry.name,
            "path": os.path.join(file_path, entry.name),
            "type": "File" if entry.is_file() else "Directory",
            "size": os.path.getsize(entry.path) if entry.is_file() else None,
        }
        for entry in os.scandir(path)
    ]

    return paths


def list_files(source_path: str) -> List[PathContent]:
    data: List[PathContent] = []
    for root_dir, dirs, files in os.walk(source_path):
        data.extend(
            {
                "name": file_name,
                "type": "File",
                "size": os.path.getsize(os.path.join(root_dir, file_name)),
            }
            for file_name in files
        )
        data.extend(
            {"name": dir_name, "type": "Directory", "size": None}
            for dir_name in dirs
        )
    return data


def clear_files(folder: str) -> List[str]:
    """Clean files from a given folder."""
    files = []
    for file in os.scandir(folder):
        files.append(os.path.relpath(file.path, start=folder))
        if file.is_file():
            os.remove(file.path)
        if file.is_dir():
            files += clear_files(file.path)
            os.rmdir(file.path)
    return files


def create_directory(path: str, name: str) -> None:
    """Create a new on the file storage."""
    os.mkdir(os.path.join(path, name))


def remove_path_from_storage(path: str) -> None:
    """Remove path from storage."""
    os.rmdir(path)
