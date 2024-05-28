import json
import os
import sys
from pathlib import Path


def is_packaged():
    deployed = True
    try:
        sys._MEIPASS  # PyInstaller creates a temp folder and stores path in _MEIPASS
    except Exception:
        deployed = False

    return deployed


def resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller"""
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = Path(__file__).parent.parent.parent.parent

    return Path(base_path) / relative_path


is_test_environment = os.environ.get("VITEST")

path_config = resource_path(
    "paths.config.json"
)  # NOTE: Must have pyflask for running the GUIDE as a whole, but errors for just the server

f = path_config.open()
data = json.load(f)
GUIDE_ROOT_FOLDER = Path(Path.home(), data["root"])

if is_test_environment:
    GUIDE_ROOT_FOLDER = GUIDE_ROOT_FOLDER / ".test"

STUB_SAVE_FOLDER_PATH = Path(GUIDE_ROOT_FOLDER, *data["subfolders"]["preview"])
CONVERSION_SAVE_FOLDER_PATH = Path(GUIDE_ROOT_FOLDER, *data["subfolders"]["conversions"])

f.close()

# Create all nested home folders
STUB_SAVE_FOLDER_PATH.mkdir(exist_ok=True, parents=True)
CONVERSION_SAVE_FOLDER_PATH.mkdir(exist_ok=True, parents=True)
