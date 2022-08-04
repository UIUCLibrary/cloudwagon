import os


def is_within_valid_directory(root, path) -> bool:
    return os.path.commonpath(
        [os.path.abspath(root)]
    ) == os.path.commonpath([
        os.path.abspath(root),
        os.path.abspath(path)
    ])


def get_path_contents(path: str, starting: str):
    file_path = os.path.relpath(path, starting)
    if file_path == ".":
        file_path = "/"
    if not is_within_valid_directory(path, starting):
        p = os.path.join(file_path, "..")
        paths = [
            {
                "name": "..",
                "path": os.path.normpath(f"/{p}"),
                "location": os.path.abspath(
                    os.path.join(file_path, "..")),
                "type": "Directory",
                "size": None
            }
        ]
    else:
        paths = []
    paths += [
        {
            "name": entry.name,
            "path": os.path.join(file_path, entry.name),
            "location": os.path.abspath(os.path.join(file_path, entry.name)),
            "type": "File" if entry.is_file() else "Directory",
            "size": os.path.getsize(entry.path) if entry.is_file() else None
        } for entry in os.scandir(path)
    ]
    return paths


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
        if file.is_file():
            os.remove(file.path)
        if file.is_dir():
            files += clear_files(file.path)
            os.rmdir(file.path)
    return files
