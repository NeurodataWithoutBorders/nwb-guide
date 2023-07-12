from pathlib import Path
import json
import os
import sys


def resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller"""
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return Path(base_path) / relative_path


path_config = resource_path(
    "paths.config.json"
)  # NOTE: Must have pyflask for running the GUIDE as a whole, but errors for just the server
f = path_config.open()
data = json.load(f)
STUB_SAVE_FOLDER_PATH = Path(Path.home(), data["root"], *data["subfolders"]["stubs"])
CONVERSION_SAVE_FOLDER_PATH = Path(Path.home(), data["root"], *data["subfolders"]["conversions"])
TUTORIAL_SAVE_FOLDER_PATH = Path(Path.home(), data["root"], *data["subfolders"]["tutorial"])

f.close()
