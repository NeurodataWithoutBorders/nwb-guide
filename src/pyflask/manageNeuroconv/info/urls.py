import json
import os
import pathlib
import sys


def get_source_base_path() -> pathlib.Path:
    """Get absolute path of a relative resource to the app; works for both dev mode and for PyInstaller."""
    # Production: PyInstaller creates a temp folder and stores path in _MEIPASS
    if hasattr(sys, "_MEIPASS"):
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = pathlib.Path(sys._MEIPASS)

    # Dev mode: base is the root of the `src` directory for the project
    else:
        base_path = pathlib.Path(__file__).parent.parent.parent.parent

    return base_path


def get_project_root_path() -> pathlib.Path:
    """Get absolute path of a relative resource to the app; works for both dev mode and for PyInstaller."""
    # Production: PyInstaller creates a temp folder and stores path in _MEIPASS
    if hasattr(sys, "_MEIPASS"):
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = pathlib.Path(sys._MEIPASS).parent

    # Dev mode: base is the root of the `src` directory for the project
    else:
        base_path = pathlib.Path(__file__).parent.parent.parent.parent.parent

    return base_path


is_test_environment = os.environ.get("VITEST")


path_config_file_path = get_source_base_path() / "paths.config.json"
with open(file=path_config_file_path, mode="r") as fp:
    path_config = json.load(fp=fp)
GUIDE_ROOT_FOLDER = pathlib.Path.home() / path_config["root"]

if is_test_environment:
    GUIDE_ROOT_FOLDER = GUIDE_ROOT_FOLDER / ".test"

STUB_SAVE_FOLDER_PATH = pathlib.Path(GUIDE_ROOT_FOLDER, *path_config["subfolders"]["preview"])
CONVERSION_SAVE_FOLDER_PATH = pathlib.Path(GUIDE_ROOT_FOLDER, *path_config["subfolders"]["conversions"])

# Create all nested home folders
STUB_SAVE_FOLDER_PATH.mkdir(exist_ok=True, parents=True)
CONVERSION_SAVE_FOLDER_PATH.mkdir(exist_ok=True, parents=True)
