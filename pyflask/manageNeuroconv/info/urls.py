from pathlib import Path
import json
import os
import sys

def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return Path(base_path) / relative_path

path_config = resource_path("paths.config.json")
f = path_config.open()
data = json.load(f)
STUB_SAVE_FOLDER_PATH = Path(Path.home(), *data["stubs"])
CONVERSION_SAVE_FOLDER_PATH = Path(Path.home(), *data["conversions"])

f.close()
