import os
from werkzeug.utils import secure_filename


def get_path_contents(path: str, starting: str):
    file_path = os.path.relpath(path, starting)
    if file_path == ".":
        file_path = "/"
    return [
        {
            "name": entry.name,
            "path": f'{os.path.abspath(os.path.join(file_path, entry.name))}',
            "type": "File" if entry.is_file() else "Directory",
            "size": os.path.getsize(entry.path) if entry.is_file() else None
        } for entry in os.scandir(path)
    ]

def list_files(source_path):
    data = []
    for root_dir, dirs, files in os.walk(source_path):
        data.extend(
            {
                "name": file_name,
                "type": "File",
                "size": os.path.getsize(os.path.join(root_dir, file_name))
            } for file_name in files
        )
        data.extend(
            {
                "name": dir_name,
                "type": "Directory",
                "size": None
            } for dir_name in dirs
        )
    return data


# def upload_file(file, destination: str):
#     filename = secure_filename(file.filename)
#     print(filename)
#     file.save((os.path.join(destination, filename)))
#     return "ok"


def clear_files(folder):
    files = []
    for file in os.scandir(folder):
        files.append(os.path.relpath(file.path, start=folder))
        os.remove(file.path)
    return files
