"""
Calling `pyi-makespec` regenerates the base spec file, but we need to extend the recursion limit.

This script is run automatically as a part of `npm run build:flask:spec` after the `pyi-makespec` call.
"""
from pathlib import Path

with open(file=Path(__file__).parent / "nwb-guide.spec", mode="r") as io:
    lines = io.readlines()

lines.insert(1, "import sys\n")
lines.insert(2, "from pathlib import Path\n")
lines.insert(3, "\n")
lines.insert(4, "sys.setrecursionlimit(sys.getrecursionlimit() * 5)\n")
lines.insert(5, "\n")

# Originally this was a separate `npm` command per platform to account for CLI syntax differences between ; and :
# The spec file is, however, the same across platforms
data_line_index = lines.index("datas = []\n")
lines[data_line_index] = "datas = [('./paths.config.json', '.'), ('./package.json', '.')]\n"

# Another platform specific difference is the app.py location
app_py_line_index, app_py_line = next((index, line) for index, line in enumerate(lines) if "app.py" in line)
pyflask_start = app_py_line.find("pyflask")  # Can change on certain systems
injected_app_py_line_base = app_py_line[: (pyflask_start - 1)]
injected_app_py_line = injected_app_py_line_base + "f\"{Path('pyflask') / 'app.py'}\"],\n"
lines[app_py_line_index] = injected_app_py_line

with open(file=Path(__file__).parent / "nwb-guide.spec", mode="w") as io:
    io.writelines(lines)

print("Sucessfully injected recursion depth extension and json paths!")
