from pathlib import Path
import json

project_base_path = Path(__file__).parent.parent.parent.parent
path_config = Path(
    project_base_path, "paths.config.json"
)  # NOTE: You're going to have to ensure that this copies over to the Python distribution
f = path_config.open()
data = json.load(f)
stub_save_path = Path(Path.home(), *data["stubs"])
conversion_save_path = Path(Path.home(), *data["conversions"])

f.close()