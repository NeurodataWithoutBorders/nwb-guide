# -*- mode: python ; coding: utf-8 -*-
import sys
from pathlib import Path
import scipy
from PyInstaller.utils.hooks import collect_submodules

sys.setrecursionlimit(sys.getrecursionlimit() * 5)

import scipy
from PyInstaller.utils.hooks import collect_data_files
from PyInstaller.utils.hooks import collect_all

datas = [('./src/paths.config.json', '.'), ('./package.json', '.')]
binaries = []
hiddenimports = [
    'email_validator',
    *collect_submodules('scipy.special.cython_special'),
    *collect_submodules('scipy.special._cdflib'),
    'scipy._lib.array_api_compat.numpy.fft',
]

datas += collect_data_files('jsonschema_specifications')

# Various consequences of lazy imports
modules_to_collect = [
    'dandi',
    'keyrings',
    'unittest',
    'nwbinspector',
    'neuroconv',
    'pynwb',
    'hdmf',
    'hdmf_zarr',
    'ndx_dandi_icephys',
    'sklearn',
    'ci_info',
    'tifffile',
    'dlc2nwb',
    'sleap_io',
    'ndx_pose',
    'tzdata',
    'elephant',
    'ScanImageTiffReader',
    'deprecated',
    'h5py',
]
for module_name in modules_to_collect:
    collection = collect_all(module_name)

    datas += collection[0]
    binaries += collection[1]
    hiddenimports += collection[2]

block_cipher = None


a = Analysis(
    [f"{Path('src') / 'pyflask' / 'app.py'}"],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='nwb-guide',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='nwb-guide',
)
