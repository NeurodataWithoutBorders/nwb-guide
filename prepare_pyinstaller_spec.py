"""
Calling `pyi-makespec` regenerates the base spec file, but we need to extend the recursion limit.

This script is run automatically as a part of `npm run build:flask:spec` after the `pyi-makespec` call.
"""
from pathlib import Path

with open(file=Path(__file__).parent / "nwb-guide.spec", mode="r") as io:
    lines = io.readlines()

lines.insert(1, "import sys\n")
lines.insert(2, "sys.setrecursionlimit(sys.getrecursionlimit() * 5)\n")
lines.insert(3, "\n")

# Originally this was a separate `npm` command per platform to account for CLI syntax differences between ; and :
# The spec file is, however, the same across platforms
data_line_index = lines.index("datas = []\n")
lines[data_line_index] = "datas = [('./paths.config.json', '.'), ('./package.json', '.')]\n"

with open(file=Path(__file__).parent / "nwb-guide.spec", mode="w") as io:
    io.writelines(lines)

print("Sucessfully injected recursion depth extension and json paths!")
