import os
from werkzeug.utils import secure_filename


def list_files(source_path):
    data = []
    for root_dir, dirs, files in os.walk(source_path):
        data.extend(
            os.path.relpath(
                os.path.join(root_dir, file_name), source_path
            ) for file_name in files
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
