# Canonical CatalystNeuro NWB Conversion Repo Structure

This document is a practical reference for generating a new `<lab>-lab-to-nwb` conversion repository following the CatalystNeuro pattern established by the [cookiecutter-my-lab-to-nwb-template](https://github.com/catalystneuro/cookiecutter-my-lab-to-nwb-template). All code examples are drawn from real production repos (cai-lab-to-nwb, giocomo-lab-to-nwb).

---

## 1. Directory Structure

A conversion repo has this exact layout:

```
<lab>-lab-to-nwb/
├── .github/
│   └── workflows/
│       ├── auto-publish.yml      # PyPI publish on GitHub release
│       └── test-install.yml      # Monthly CI: install + import test
├── .gitignore
├── .pre-commit-config.yaml       # black, ruff, codespell, trailing whitespace
├── LICENSE                       # BSD-3
├── README.md
├── make_env.yml                  # Conda environment definition
├── pyproject.toml                # Build config, deps, tooling
└── src/
    └── <lab>_lab_to_nwb/         # Python package (underscored slug)
        ├── __init__.py           # Empty or minimal
        ├── <conversion_a>/       # One directory per conversion/experiment
        │   ├── __init__.py       # Exports the NWBConverter and custom interfaces
        │   ├── <conversion_a>_nwbconverter.py
        │   ├── <conversion_a>_convert_session.py
        │   ├── <conversion_a>_convert_all_sessions.py
        │   ├── <conversion_a>_metadata.yaml
        │   ├── <custom_interface_1>.py
        │   ├── <custom_interface_2>.py
        │   ├── interfaces/       # Optional: subdirectory if many interfaces
        │   │   ├── __init__.py
        │   │   ├── <interface_1>.py
        │   │   └── <interface_2>.py
        │   ├── utils/            # Optional: helper scripts
        │   └── conversion_notes.md  # Free-form notes about the conversion
        └── <conversion_b>/       # Additional conversions for the same lab
            └── ...
```

### Naming conventions

| Concept | Convention | Example |
|---------|-----------|---------|
| Repo name | `<lab>-lab-to-nwb` | `cai-lab-to-nwb` |
| Package slug | `<lab>_lab_to_nwb` (underscored) | `cai_lab_to_nwb` |
| Conversion directory | `<first_author><year>` or descriptive name | `zaki_2024`, `wen22` |
| NWBConverter class | `<ConversionCamelCase>NWBConverter` | `Zaki2024NWBConverter` |
| Interface class | `<ConversionCamelCase><Modality>Interface` | `Zaki2024ShockStimuliInterface` |
| Metadata file | `<conversion_name>_metadata.yaml` | `zaki_2024_metadata.yaml` |
| Convert session script | `<conversion_name>_convert_session.py` | `zaki_2024_convert_session.py` |
| Convert all script | `<conversion_name>_convert_all_sessions.py` | `zaki_2024_convert_all_sessions.py` |

### The `__init__.py` files

The conversion-level `__init__.py` exports the key classes so they can be imported cleanly:

```python
# src/cai_lab_to_nwb/zaki_2024/__init__.py
# (can be empty, or export key classes)
```

If you have an `interfaces/` subdirectory, its `__init__.py` re-exports everything:

```python
# src/cai_lab_to_nwb/zaki_2024/interfaces/__init__.py
from .eztrack_interface import EzTrackFreezingBehaviorInterface
from .zaki_2024_edf_interface import Zaki2024EDFInterface, Zaki2024MultiEDFInterface
from .minian_interface import MinianSegmentationInterface, MinianMotionCorrectionInterface
from .zaki_2024_sleep_classification_interface import Zaki2024SleepClassificationInterface
from .miniscope_imaging_interface import MiniscopeImagingInterface
from .zaki_2024_shock_stimuli_interface import Zaki2024ShockStimuliInterface
from .zaki_2024_cell_registration_interface import Zaki2024CellRegistrationInterface
```

---

## 2. pyproject.toml

The build system uses **hatchling** (the modern standard). Here is the canonical structure with all required fields:

```toml
[project]
name = "<lab>-lab-to-nwb"
version = "0.0.1"
description = "NWB conversion scripts, functions, and classes for <Lab Name> lab conversion"
readme = "README.md"
authors = [{ name = "CatalystNeuro", email = "ben.dichter@catalystneuro.com" }]
maintainers = [{ name = "CatalystNeuro", email = "ben.dichter@catalystneuro.com" }]
license = { file = "LICENSE" }
requires-python = ">=3.10"
classifiers = [
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Programming Language :: Python :: 3.13"
]

dependencies = [
  "neuroconv",
  "nwbinspector",
]

[project.urls]
Repository = "https://github.com/catalystneuro/<lab>-lab-to-nwb"

# Per-conversion pinned dependencies (install with: pip install -e .[conversion_name])
[project.optional-dependencies]
<conversion_name> = [
  "neuroconv==0.7.0",   # Pin to exact version used during development
  # Add conversion-specific extras here, e.g.:
  # "mne",
  # "opencv-python-headless",
  # "ndx-miniscope==0.5.1",
]

[dependency-groups]
dev = [
  "pre-commit",
  "ruff",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build]
include = [
  "*.yaml",
  "*.yml",
  "*.json",
]  # Ensures metadata YAML files are included in sdist and wheel

[tool.hatch.build.targets.wheel]
packages = ["src/<lab>_lab_to_nwb"]

[tool.hatch.build.targets.sdist]
packages = ["src/<lab>_lab_to_nwb"]

[tool.ruff]

[tool.ruff.lint]
select = [
    "F401",   # Unused import
    "I",      # All isort rules
    "UP006",  # non-pep585 annotation
    "UP007",  # non-pep604 annotation (Union -> |)
    "UP045",  # non-pep604 annotation (Optional -> | None)
]
fixable = ["ALL"]

[tool.ruff.lint.isort]
relative-imports-order = "closest-to-furthest"
known-first-party = ["<lab>_lab_to_nwb"]

[tool.codespell]
skip = '.git*,*.pdf,*.css'
check-hidden = true
ignore-words-list = 'assertin'
```

### Key points about dependencies

- The top-level `dependencies` list should contain unpinned `neuroconv` and `nwbinspector` for broad compatibility.
- Per-conversion optional dependencies should **pin exact versions** so that a specific conversion remains reproducible.
- Conversion-specific extras (e.g., `mne` for EDF files, `opencv-python-headless` for video, NWB extension packages like `ndx-miniscope`) go in the optional dependencies section.

### Real-world example (cai-lab-to-nwb)

The cai-lab-to-nwb repo pins all its core dependencies because it has a single primary conversion:

```toml
dependencies = [
  "pynwb==3.0.0",
  "neuroconv==0.7.4",
  "nwbinspector==0.6.3",
  "roiextractors==0.5.13",
  "ipykernel",
  "openpyxl",
  "mne",
  "opencv-python-headless",
  "ndx-miniscope==0.5.1",
]
```

---

## 3. NWBConverter Class

The `NWBConverter` is the central orchestrator. It declares which `DataInterface` classes handle each data modality and wires them together.

### The pattern

```python
"""Primary NWBConverter class for this dataset."""
from neuroconv import NWBConverter
from neuroconv.datainterfaces import (
    SpikeGLXRecordingInterface,
    PhySortingInterface,
)

from <lab>_lab_to_nwb.<conversion_name>.interfaces import (
    <ConversionName>BehaviorInterface,
)


class <ConversionName>NWBConverter(NWBConverter):
    """Primary conversion class for <description of dataset>."""

    data_interface_classes = dict(
        Recording=SpikeGLXRecordingInterface,
        Sorting=PhySortingInterface,
        Behavior=<ConversionName>BehaviorInterface,
    )
```

### How to choose interfaces

The `data_interface_classes` dict maps **arbitrary string keys** to interface classes. The keys become the keys you use in `source_data` and `conversion_options` dicts. Choose keys that describe the data modality clearly.

Common built-in interfaces from `neuroconv.datainterfaces`:

| Modality | Interface | When to use |
|----------|-----------|-------------|
| Neuropixels raw | `SpikeGLXRecordingInterface` | SpikeGLX .bin/.meta files |
| Neuropixels LFP | `SpikeGLXLFPInterface` | SpikeGLX LFP band |
| Spike sorting | `PhySortingInterface` | Phy/Kilosort output |
| Spike sorting | `KiloSortSortingInterface` | KiloSort output directly |
| Calcium imaging | `TiffImagingInterface` | TIFF stacks |
| Calcium segmentation | `Suite2pSegmentationInterface` | Suite2p output |
| Video | `VideoInterface` | Behavioral video files |
| Intracellular | `AbfInterface` | Axon Binary Format |
| EDF signals | Custom needed | EDF format |

When no built-in interface exists for a data type, write a custom `BaseDataInterface` subclass (see Section 6).

### Real-world example (cai-lab-to-nwb, zaki_2024)

This converter has 10 data interfaces, mixing built-in and custom:

```python
from neuroconv import NWBConverter
from neuroconv.datainterfaces import VideoInterface
from neuroconv.utils.dict import DeepDict
from datetime import timedelta

from cai_lab_to_nwb.zaki_2024.interfaces import (
    MinianSegmentationInterface,
    Zaki2024EDFInterface,
    Zaki2024MultiEDFInterface,
    EzTrackFreezingBehaviorInterface,
    Zaki2024SleepClassificationInterface,
    MiniscopeImagingInterface,
    MinianMotionCorrectionInterface,
    Zaki2024ShockStimuliInterface,
    Zaki2024CellRegistrationInterface,
)


class Zaki2024NWBConverter(NWBConverter):
    """Primary conversion class Cai Lab dataset."""

    data_interface_classes = dict(
        MiniscopeImaging=MiniscopeImagingInterface,
        MinianSegmentation=MinianSegmentationInterface,
        MinianMotionCorrection=MinianMotionCorrectionInterface,
        SleepClassification=Zaki2024SleepClassificationInterface,
        EDFSignals=Zaki2024EDFInterface,
        MultiEDFSignals=Zaki2024MultiEDFInterface,
        FreezingBehavior=EzTrackFreezingBehaviorInterface,
        Video=VideoInterface,
        ShockStimuli=Zaki2024ShockStimuliInterface,
        CellRegistration=Zaki2024CellRegistrationInterface,
    )
```

### Overriding `get_metadata()`

Override `get_metadata()` when you need to compute metadata that depends on the source data itself:

```python
def get_metadata(self) -> DeepDict:
    metadata = super().get_metadata()

    # Example: adjust session_start_time based on imaging timestamps
    if "MiniscopeImaging" in self.data_interface_objects:
        imaging_interface = self.data_interface_objects["MiniscopeImaging"]
        imaging_timestamps = imaging_interface.get_original_timestamps()
        if imaging_timestamps[0] < 0.0:
            time_shift = timedelta(seconds=abs(imaging_timestamps[0]))
            session_start_time = imaging_interface.get_metadata()["NWBFile"]["session_start_time"]
            metadata["NWBFile"].update(session_start_time=session_start_time - time_shift)

    return metadata
```

### Not all interfaces must be present in every session

The converter class declares the **superset** of all possible interfaces. In `convert_session.py`, you only add entries to `source_data` for interfaces that are relevant to that particular session. The converter will only instantiate interfaces that have entries in `source_data`.

---

## 4. convert_session.py

This is the script that converts a single session. It follows a strict pattern:

1. Build `source_data` dict (file paths for each interface)
2. Build `conversion_options` dict (per-interface options like `stub_test`)
3. Instantiate the converter
4. Get auto-extracted metadata, layer on YAML metadata, layer on session-specific metadata
5. Call `converter.run_conversion()`

### The canonical pattern

```python
"""Primary script to run to convert an entire session of data using the NWBConverter."""
from pathlib import Path
from typing import Union
from datetime import datetime
from zoneinfo import ZoneInfo

from neuroconv.utils import load_dict_from_file, dict_deep_update

from <lab>_lab_to_nwb.<conversion_name>.<conversion_name>_nwbconverter import <ConversionName>NWBConverter


def session_to_nwb(
    data_dir_path: Union[str, Path],
    output_dir_path: Union[str, Path],
    stub_test: bool = False,
):
    data_dir_path = Path(data_dir_path)
    output_dir_path = Path(output_dir_path)
    if stub_test:
        output_dir_path = output_dir_path / "nwb_stub"
    output_dir_path.mkdir(parents=True, exist_ok=True)

    session_id = "subject_session_identifier"
    nwbfile_path = output_dir_path / f"{session_id}.nwb"

    # ---- Step 1: Build source_data and conversion_options ----
    source_data = dict()
    conversion_options = dict()

    # Add Recording
    source_data.update(dict(Recording=dict(
        file_path=str(data_dir_path / "recording.ap.bin"),
    )))
    conversion_options.update(dict(Recording=dict(stub_test=stub_test)))

    # Add Sorting
    source_data.update(dict(Sorting=dict(
        folder_path=str(data_dir_path / "sorting"),
    )))
    conversion_options.update(dict(Sorting=dict()))

    # Add Behavior (custom interface)
    source_data.update(dict(Behavior=dict(
        file_path=str(data_dir_path / "behavior.csv"),
    )))
    conversion_options.update(dict(Behavior=dict()))

    # ---- Step 2: Instantiate converter ----
    converter = <ConversionName>NWBConverter(source_data=source_data)

    # ---- Step 3: Build metadata (layered) ----
    # Layer 1: Auto-extracted from source files
    metadata = converter.get_metadata()

    # Layer 2: Set session_start_time with timezone
    session_start_time = datetime(year=2020, month=1, day=1, tzinfo=ZoneInfo("US/Eastern"))
    metadata["NWBFile"]["session_start_time"] = session_start_time

    # Layer 3: Merge in the hand-edited YAML metadata
    editable_metadata_path = Path(__file__).parent / "<conversion_name>_metadata.yaml"
    editable_metadata = load_dict_from_file(editable_metadata_path)
    metadata = dict_deep_update(metadata, editable_metadata)

    # Layer 4: Session-specific overrides
    metadata["Subject"]["subject_id"] = "mouse001"
    metadata["NWBFile"]["session_id"] = session_id

    # ---- Step 4: Run conversion ----
    converter.run_conversion(
        metadata=metadata,
        nwbfile_path=nwbfile_path,
        conversion_options=conversion_options,
        overwrite=True,
    )


if __name__ == "__main__":
    data_dir_path = Path("/path/to/raw/data/")
    output_dir_path = Path("~/conversion_nwb/")
    stub_test = False

    session_to_nwb(
        data_dir_path=data_dir_path,
        output_dir_path=output_dir_path,
        stub_test=stub_test,
    )
```

### Metadata layering order

This is critical. Later layers override earlier ones:

1. **Auto-extracted** (`converter.get_metadata()`): Reads metadata from the source files themselves (e.g., sampling rate from SpikeGLX .meta files, session_start_time from file timestamps).
2. **session_start_time with timezone**: Must always be set explicitly with a timezone. Use `ZoneInfo` (Python 3.9+) or `pytz`.
3. **YAML file** (`dict_deep_update` with loaded YAML): Lab-level metadata that applies to all sessions of this conversion (institution, lab, experimenter, species, publications, etc.).
4. **Session-specific overrides**: `subject_id`, `session_id`, `session_description`, etc. that vary per session.

### Real-world example (cai-lab-to-nwb, zaki_2024)

The real convert_session.py shows the pattern with conditional interface inclusion (not all sessions have all data types):

```python
def session_to_nwb(
    output_dir_path: Union[str, Path],
    subject_id: str,
    session_id: str,
    date_str: str,
    time_str: str,
    session_description: str,
    stub_test: bool = False,
    overwrite: bool = False,
    verbose: bool = False,
    imaging_folder_path: Union[str, Path] = None,
    minian_folder_path: Union[str, Path] = None,
    video_file_path: Union[str, Path] = None,
    freezing_output_file_path: Union[str, Path] = None,
    edf_file_path: Union[str, Path] = None,
    sleep_classification_file_path: Union[str, Path] = None,
    shock_stimulus: dict = None,
):
    # ...
    source_data = dict()
    conversion_options = dict()

    # Conditionally add interfaces based on what data is available
    if imaging_folder_path:
        imaging_folder_path = Path(imaging_folder_path)
        source_data.update(dict(MiniscopeImaging=dict(folder_path=imaging_folder_path)))
        conversion_options.update(dict(MiniscopeImaging=dict(stub_test=stub_test)))

    if minian_folder_path:
        minian_folder_path = Path(minian_folder_path)
        source_data.update(dict(MinianSegmentation=dict(folder_path=minian_folder_path)))
        conversion_options.update(dict(MinianSegmentation=dict(stub_test=stub_test)))

    if video_file_path:
        source_data.update(dict(Video=dict(file_paths=[video_file_path])))
        conversion_options.update(dict(Video=dict(stub_test=stub_test)))

    if shock_stimulus is not None:
        source_data.update(ShockStimuli=dict())
        conversion_options.update(ShockStimuli=shock_stimulus)

    converter = Zaki2024NWBConverter(source_data=source_data, verbose=verbose)
    metadata = converter.get_metadata()

    # Timezone localization
    eastern = pytz.timezone("US/Eastern")
    metadata["NWBFile"]["session_start_time"] = eastern.localize(
        metadata["NWBFile"]["session_start_time"]
    )

    # YAML metadata layer
    editable_metadata_path = Path(__file__).parent / "zaki_2024_metadata.yaml"
    editable_metadata = load_dict_from_file(editable_metadata_path)
    metadata = dict_deep_update(metadata, editable_metadata)

    # Session-specific metadata
    metadata["Subject"]["subject_id"] = subject_id
    metadata["NWBFile"]["session_description"] = session_description
    metadata["NWBFile"]["session_id"] = session_id

    converter.run_conversion(
        metadata=metadata,
        nwbfile_path=nwbfile_path,
        conversion_options=conversion_options,
        overwrite=overwrite,
    )
```

### The `stub_test` pattern

The `stub_test` parameter is a convention that:
- Redirects output to a `nwb_stub/` subdirectory
- Gets passed to each interface's `conversion_options` so they only write a small subset of data (e.g., first few seconds of recording)
- Enables fast iteration during development without writing full datasets

```python
if stub_test:
    output_dir_path = output_dir_path / "nwb_stub"
# ...
conversion_options.update(dict(Recording=dict(stub_test=stub_test)))
```

### NWB file naming

Use descriptive, BIDS-like naming: `sub-<subject_id>_ses-<session_id>.nwb` or simply `<session_id>.nwb`.

---

## 5. convert_all_sessions.py

This script handles batch conversion of all sessions in a dataset. It follows a template pattern with three functions:

### The canonical pattern

```python
"""Primary script to run to convert all sessions in a dataset using session_to_nwb."""
from pathlib import Path
from typing import Union
from concurrent.futures import ProcessPoolExecutor, as_completed
from pprint import pformat
import traceback
from tqdm import tqdm

from .convert_session import session_to_nwb


def dataset_to_nwb(
    *,
    data_dir_path: Union[str, Path],
    output_dir_path: Union[str, Path],
    max_workers: int = 1,
    verbose: bool = True,
    stub_test: bool = False,
):
    """Convert the entire dataset to NWB.

    Parameters
    ----------
    data_dir_path : Union[str, Path]
        The path to the directory containing the raw data.
    output_dir_path : Union[str, Path]
        The path to the directory where the NWB files will be saved.
    max_workers : int, optional
        The number of workers to use for parallel processing, by default 1
    verbose : bool, optional
        Whether to print verbose output, by default True
    stub_test : bool, optional
        Whether to run in stub test mode, by default False
    """
    data_dir_path = Path(data_dir_path)
    output_dir_path = Path(output_dir_path)
    session_to_nwb_kwargs_per_session = get_session_to_nwb_kwargs_per_session(
        data_dir_path=data_dir_path,
    )

    futures = []
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        for session_to_nwb_kwargs in session_to_nwb_kwargs_per_session:
            session_to_nwb_kwargs["output_dir_path"] = output_dir_path
            session_to_nwb_kwargs["verbose"] = verbose
            session_to_nwb_kwargs["stub_test"] = stub_test
            exception_file_path = (
                data_dir_path / f"ERROR_{session_to_nwb_kwargs.get('session_id', 'unknown')}.txt"
            )
            futures.append(
                executor.submit(
                    safe_session_to_nwb,
                    session_to_nwb_kwargs=session_to_nwb_kwargs,
                    exception_file_path=exception_file_path,
                )
            )
        for _ in tqdm(as_completed(futures), total=len(futures)):
            pass


def safe_session_to_nwb(
    *,
    session_to_nwb_kwargs: dict,
    exception_file_path: Union[Path, str],
):
    """Convert a session to NWB while handling any errors by writing to exception_file_path."""
    exception_file_path = Path(exception_file_path)
    try:
        session_to_nwb(**session_to_nwb_kwargs)
    except Exception as e:
        with open(exception_file_path, mode="w") as f:
            f.write(f"session_to_nwb_kwargs: \n {pformat(session_to_nwb_kwargs)}\n\n")
            f.write(traceback.format_exc())


def get_session_to_nwb_kwargs_per_session(
    *,
    data_dir_path: Union[str, Path],
):
    """Get the kwargs for session_to_nwb for each session in the dataset.

    Returns
    -------
    list[dict[str, Any]]
        A list of dictionaries containing the kwargs for session_to_nwb for each session.
    """
    # IMPLEMENT THIS: Return a list of dicts, each containing the kwargs for one session.
    # Common strategies:
    #   1. Iterate over session directories: list(data_dir_path.iterdir())
    #   2. Read from a spreadsheet/CSV with session metadata
    #   3. Load from a pre-computed YAML parameters file
    raise NotImplementedError


if __name__ == "__main__":
    data_dir_path = Path("/path/to/raw/data/")
    output_dir_path = Path("~/conversion_nwb/")
    max_workers = 1
    stub_test = False

    dataset_to_nwb(
        data_dir_path=data_dir_path,
        output_dir_path=output_dir_path,
        max_workers=max_workers,
        stub_test=stub_test,
    )
```

### Key design decisions

- **`ProcessPoolExecutor`**: Enables parallel conversion of sessions. Default `max_workers=1` for sequential processing.
- **`safe_session_to_nwb`**: Wraps `session_to_nwb` in a try/except that writes errors to a file instead of crashing the batch. This is critical for large datasets.
- **`get_session_to_nwb_kwargs_per_session`**: This is the function that must be customized per conversion. It returns a list of dicts, where each dict contains exactly the kwargs needed by `session_to_nwb`.

### Real-world example of `get_session_to_nwb_kwargs_per_session` (cai-lab-to-nwb)

```python
def get_session_to_nwb_kwargs_per_session(*, data_dir_path):
    import pandas as pd
    subjects_df = pd.read_excel(data_dir_path / "Ca_EEG_Design.xlsx")
    subjects = subjects_df["Mouse"]
    session_to_nwb_kwargs_per_session = []

    for subject_id in subjects:
        yaml_file_path = Path(__file__).parent / "utils/conversion_parameters.yaml"
        conversion_parameter_dict = load_dict_from_file(yaml_file_path)
        if subject_id in conversion_parameter_dict:
            for session_id in conversion_parameter_dict[subject_id].keys():
                session_to_nwb_kwargs_per_session.append(
                    conversion_parameter_dict[subject_id][session_id]
                )

    return session_to_nwb_kwargs_per_session
```

### Real-world example of iterating over directories (giocomo-lab-to-nwb wen22)

The wen22 conversion uses a simpler pattern -- iterating directly over session directories:

```python
session_path_list = [path for path in data_path.iterdir() if path.name != "VR"]
for session_path in session_path_list:
    session_id = session_path.name
    # ... build source_data from session_path ...
    converter = Wen21NWBConverter(source_data=source_data)
    # ... run conversion ...
```

---

## 6. Custom DataInterface

When no built-in NeuroConv interface exists for a data type, write a custom one by subclassing `BaseDataInterface`. This is the most common customization point.

### The pattern

```python
"""Primary class for converting experiment-specific <modality>."""
from pynwb.file import NWBFile

from neuroconv.basedatainterface import BaseDataInterface
from neuroconv.utils import DeepDict


class <ConversionName><Modality>Interface(BaseDataInterface):
    """<Modality> interface for <conversion_name> conversion."""

    keywords = ["behavior"]  # Used for discoverability

    def __init__(self, file_path: str, verbose: bool = False):
        # Load data LAZILY -- do not read entire files here.
        # Store paths and parameters as instance attributes.
        # Call super().__init__() to register source_data.
        self.file_path = file_path
        self.verbose = verbose
        super().__init__(file_path=file_path)

    def get_metadata(self) -> DeepDict:
        # Extract metadata from source files that can be auto-detected.
        # Return a DeepDict (nested dict) matching the NWB metadata schema.
        metadata = super().get_metadata()
        # Example: metadata["NWBFile"]["session_start_time"] = <extracted_datetime>
        return metadata

    def add_to_nwbfile(self, nwbfile: NWBFile, metadata: dict, **conversion_options):
        # The core method. Read data from source files and add to the NWBFile.
        # conversion_options come from the conversion_options dict passed to run_conversion.
        raise NotImplementedError()
```

### Critical details about `__init__`

- The `__init__` method's parameters become the keys in the `source_data` dict.
- Call `super().__init__()` and pass all the init parameters as keyword arguments. This stores them in `self.source_data` for later reference.
- Use type hints from `pydantic` for validation: `FilePath`, `DirectoryPath`.

```python
from pydantic import FilePath

class MyInterface(BaseDataInterface):
    def __init__(self, file_path: FilePath, sampling_frequency: float, verbose: bool = False):
        self.file_path = file_path
        self.verbose = verbose
        self.sampling_frequency = sampling_frequency
        super().__init__(file_path=file_path, sampling_frequency=sampling_frequency)
```

Then in `source_data`:
```python
source_data["MyModality"] = dict(file_path="/path/to/file.csv", sampling_frequency=30000.0)
```

### Critical details about `add_to_nwbfile`

- The method signature is `add_to_nwbfile(self, nwbfile: NWBFile, metadata: dict, **kwargs)`.
- Extra keyword arguments in the method signature correspond to keys in `conversion_options`.
- You can include `stub_test: bool = False` to support the stub test pattern.
- Use processing modules for derived data (see `get_module` in Section 9).

### Real-world example: Simple interface (Zaki2024ShockStimuliInterface)

This interface takes no source files -- the data is passed entirely through `conversion_options`:

```python
from pynwb.file import NWBFile
from pynwb.epoch import TimeIntervals
from neuroconv.basedatainterface import BaseDataInterface
from neuroconv.utils import DeepDict
from typing import Optional


class Zaki2024ShockStimuliInterface(BaseDataInterface):
    """Adds annotated events of shock times."""

    keywords = ["behavior", "sleep stages"]

    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        super().__init__()

    def get_metadata(self) -> DeepDict:
        metadata = super().get_metadata()
        return metadata

    def add_to_nwbfile(
        self,
        nwbfile: NWBFile,
        shock_amplitude: float,
        shock_times: list,
        shock_duration: float,
        metadata: Optional[dict] = None,
    ):
        description = (
            "During aversive encoding, after a baseline period of 2 min, "
            "mice received three 2 s foot shocks..."
        )
        shock_stimuli = TimeIntervals(name="ShockStimuli", description=description)
        shock_stimuli.add_column(name="shock_amplitude", description="Shock amplitude in mA")
        for start_time in shock_times:
            shock_stimuli.add_interval(
                start_time=start_time,
                stop_time=start_time + shock_duration,
                shock_amplitude=shock_amplitude,
            )
        nwbfile.add_stimulus(shock_stimuli)
```

The corresponding `conversion_options` in the convert_session.py:
```python
conversion_options.update(
    ShockStimuli=dict(
        shock_times=[120.0, 180.0, 240.0],
        shock_amplitude=1.5,
        shock_duration=2.0,
    ),
)
```

### Real-world example: Complex interface with temporal alignment (EzTrackFreezingBehaviorInterface)

This interface reads data from a CSV file, supports temporal alignment, and writes both a TimeSeries and TimeIntervals:

```python
import numpy as np
import pandas as pd
from pynwb import TimeSeries
from pynwb.epoch import TimeIntervals
from pynwb.file import NWBFile
from neuroconv.basedatainterface import BaseDataInterface
from neuroconv.utils import DeepDict
from pydantic import FilePath
from typing import Optional, List


class EzTrackFreezingBehaviorInterface(BaseDataInterface):
    """Adds intervals of freezing behavior and motion series."""

    keywords = ["behavior", "freezing", "motion"]

    def __init__(self, file_path: FilePath, video_sampling_frequency: float, verbose: bool = False):
        self.file_path = file_path
        self.verbose = verbose
        self.video_sampling_frequency = video_sampling_frequency
        # Private attributes for temporal alignment
        self._start_times = None
        self._stop_times = None
        self._starting_time = None

    def get_metadata(self) -> DeepDict:
        metadata = super().get_metadata()
        return metadata

    def get_interval_times(self):
        """Extract start and stop times of freezing events."""
        freezing_behavior_df = pd.read_csv(self.file_path)
        freezing_values = freezing_behavior_df["Freezing"].values
        changes_in_freezing = np.diff(freezing_values)
        freezing_start = np.where(changes_in_freezing == 100)[0] + 1
        freezing_stop = np.where(changes_in_freezing == -100)[0] + 1

        start_frames = freezing_behavior_df["Frame"].values[freezing_start]
        stop_frames = freezing_behavior_df["Frame"].values[freezing_stop]

        # Use aligned times if set, otherwise compute from frames
        start_times = (
            self._start_times if self._start_times is not None
            else start_frames / self.video_sampling_frequency
        )
        stop_times = (
            self._stop_times if self._stop_times is not None
            else stop_frames / self.video_sampling_frequency
        )
        return start_times, stop_times

    def set_aligned_interval_times(self, start_times, stop_times):
        self._start_times = start_times
        self._stop_times = stop_times

    def set_aligned_starting_time(self, aligned_start_time):
        self._starting_time = aligned_start_time

    def add_to_nwbfile(self, nwbfile: NWBFile, metadata: Optional[dict] = None, stub_test: bool = False):
        freezing_behavior_df = pd.read_csv(self.file_path)
        start_times, stop_times = self.get_interval_times()

        motion_data = freezing_behavior_df["Motion"].values
        starting_time = self._starting_time if self._starting_time is not None else self.get_starting_time()

        motion_series = TimeSeries(
            name="MotionSeries",
            description="Motion measured by pixel change between frames.",
            data=motion_data[:100] if stub_test else motion_data,
            unit="n.a",
            starting_time=starting_time,
            rate=self.video_sampling_frequency,
        )

        freeze_intervals = TimeIntervals(name="FreezingIntervals", description="...")
        for start_time, stop_time in zip(start_times, stop_times):
            freeze_intervals.add_interval(
                start_time=start_time,
                stop_time=stop_time,
                timeseries=[motion_series],
            )

        if "behavior" not in nwbfile.processing:
            behavior_module = nwbfile.create_processing_module(
                name="behavior", description="Contains behavior data"
            )
        else:
            behavior_module = nwbfile.processing["behavior"]

        behavior_module.add(motion_series)
        behavior_module.add(freeze_intervals)
```

### Real-world example: Complex interface with sync channel (Wen21EventsInterface)

This interface demonstrates reading NI-DAQ sync channels to compute behavioral timestamp offsets:

```python
from nwb_conversion_tools.basedatainterface import BaseDataInterface
from nwb_conversion_tools.utils.types import FolderPathType
from nwb_conversion_tools.tools.nwb_helpers import get_module
from hdmf.backends.hdf5.h5_utils import H5DataIO
from pynwb.behavior import Position, SpatialSeries
from pynwb import NWBFile, TimeSeries


class Wen21EventsInterface(BaseDataInterface):
    def __init__(self, session_path: FolderPathType):
        super().__init__(session_path=session_path)

    def run_conversion(self, nwbfile: NWBFile, metadata: dict):
        behavior_module = get_module(nwbfile, "behavior")
        session_path = Path(self.source_data["session_path"])

        # ... read position files, compute temporal offset from NIDQ sync channel ...

        # Add position data with compression
        spatial_series_object = SpatialSeries(
            name="position",
            description="position within the virtual reality wheel",
            data=H5DataIO(position_data, compression="gzip"),
            reference_frame="unknown",
            unit="m",
            conversion=0.01,
            timestamps=position_timestamps,
        )

        pos_obj = Position(name="position within the virtual reality wheel")
        pos_obj.add_spatial_series(spatial_series_object)
        behavior_module.add_data_interface(pos_obj)
```

Note: The older `nwb_conversion_tools` API used `run_conversion()` instead of `add_to_nwbfile()`. Modern NeuroConv uses `add_to_nwbfile()`.

---

## 7. metadata.yaml

The metadata YAML file contains hand-edited metadata that applies to all sessions of a conversion. It is loaded in `convert_session.py` and merged on top of auto-extracted metadata.

### Structure and required fields

```yaml
NWBFile:
  keywords:
    - hippocampus
    - learning
    - memory
  related_publications:
    - https://doi.org/10.1038/s41586-024-08168-4
  session_description: >
    A rich text description of the experiment. Can also just be the abstract
    of the publication. This is REQUIRED by NWB.
  experiment_description: >
    Optional longer description of the experimental protocol.
  institution: Icahn School of Medicine at Mount Sinai
  lab: Cai
  experimenter:
    - Last, First Middle
    - Last, First Middle
  surgery: >
    Optional: description of surgical procedures.
  virus: >
    Optional: description of viral constructs used.
Subject:
  species: Mus musculus      # REQUIRED. Use Latin binomial name.
  description: >
    A rich text description of the subject.
  age: P12W/P18W             # ISO 8601 duration. "P90D" = 90 days old.
  sex: M                     # One of M, F, U, or O
  strain: C57BL/6J           # Optional
  genotype: wild-type        # Optional
  date_of_birth: 2014-06-22 00:00:00-04:00  # Optional, with timezone
```

### How metadata merging works

The `dict_deep_update` function performs a recursive merge. For nested dicts, keys are merged. For lists, the entire list is replaced (not appended). For scalar values, the later value wins.

```python
from neuroconv.utils import load_dict_from_file, dict_deep_update

# Auto-extracted metadata (from file headers, etc.)
metadata = converter.get_metadata()
# Example: metadata["NWBFile"]["session_start_time"] is already set from file timestamps

# YAML metadata overlays on top
editable_metadata = load_dict_from_file(Path(__file__).parent / "metadata.yaml")
metadata = dict_deep_update(metadata, editable_metadata)
# Now metadata["NWBFile"]["lab"], ["institution"], etc. are set from the YAML
# But session_start_time from auto-extraction is preserved (YAML doesn't override it)

# Session-specific overrides
metadata["Subject"]["subject_id"] = "mouse001"  # Per-session value
```

### Extended metadata for specific modalities

For optical physiology, the metadata YAML can also define imaging planes, optical channels, etc.:

```yaml
Ophys:
  OnePhotonSeries:
    - name: OnePhotonSeries
      description: Imaging data from Miniscope.
      imaging_plane: ImagingPlane
      unit: n.a.
  ImagingPlane:
    - name: ImagingPlane
      description: Imaging plane for Miniscope imaging data.
      excitation_lambda: 496.0
      location: CA1
      device: Microscope
      optical_channel:
        - name: GreenChannel
          description: Green channel of the microscope.
          emission_lambda: 513.0
      indicator: GCaMP6f
```

### Per-subject metadata

For datasets with multiple subjects, you can use a separate YAML file for subject-specific metadata:

```yaml
# subject_metadata.yml (from giocomo wen22)
N2:
  subject_id: N2
  age: P90D
  strain: C57Bl/6
  genotype: wildtype
  date_of_birth: 2019-10-22
  weight: 0.016
  sex: U
```

Then load and merge per subject:
```python
subject_metadata_from_yaml = load_dict_from_file(Path("./subject_metadata.yml"))
subject_metadata = subject_metadata_from_yaml[subject_id]
metadata["Subject"] = dict_deep_update(metadata["Subject"], subject_metadata)
```

---

## 8. Temporal Alignment

When multiple data streams have different clocks or start times, you must align them. This is done by overriding `temporally_align_data_interfaces()` in the NWBConverter.

### The pattern

```python
class MyNWBConverter(NWBConverter):
    data_interface_classes = dict(...)

    def temporally_align_data_interfaces(self, metadata=None, conversion_options=None):
        """Align all data streams to a common time reference."""

        # Access interfaces by their keys
        if "Recording" in self.data_interface_objects:
            recording_interface = self.data_interface_objects["Recording"]
            # Get original timestamps
            original_timestamps = recording_interface.get_original_timestamps()
            # Apply a shift
            recording_interface.set_aligned_timestamps(original_timestamps + time_shift)
            # Or set just the starting time
            recording_interface.set_aligned_starting_time(new_start_time)
```

### Real-world example (cai-lab-to-nwb, zaki_2024)

This is the most comprehensive temporal alignment example available. It handles the case where imaging timestamps start before zero (negative timestamps):

```python
def temporally_align_data_interfaces(self, metadata=None, conversion_options=None):
    if "MiniscopeImaging" in self.data_interface_objects:
        imaging_interface = self.data_interface_objects["MiniscopeImaging"]
        imaging_timestamps = imaging_interface.get_original_timestamps()

        if imaging_timestamps[0] < 0.0:
            time_shift = abs(imaging_timestamps[0])

            # Shift imaging timestamps
            imaging_interface.set_aligned_timestamps(imaging_timestamps + time_shift)

            # Shift segmentation timestamps
            if "MinianSegmentation" in self.data_interface_objects:
                seg_interface = self.data_interface_objects["MinianSegmentation"]
                seg_timestamps = seg_interface.get_original_timestamps()
                seg_interface.set_aligned_timestamps(seg_timestamps + time_shift)

            # Shift sleep classification intervals
            if "SleepClassification" in self.data_interface_objects:
                sleep_interface = self.data_interface_objects["SleepClassification"]
                start_times, stop_times, states = sleep_interface.get_sleep_states_times()
                start_times += time_shift
                stop_times += time_shift
                sleep_interface.set_aligned_interval_times(
                    start_times=start_times, stop_times=stop_times
                )

            # Shift EDF starting time
            if "EDFSignals" in self.data_interface_objects:
                edf_interface = self.data_interface_objects["EDFSignals"]
                edf_interface.set_aligned_starting_time(time_shift)

            # Shift freezing behavior
            if "FreezingBehavior" in self.data_interface_objects:
                fb_interface = self.data_interface_objects["FreezingBehavior"]
                start_times, stop_times = fb_interface.get_interval_times()
                fb_interface.set_aligned_interval_times(
                    start_times=start_times + time_shift,
                    stop_times=stop_times + time_shift,
                )
                starting_time = fb_interface.get_starting_time()
                fb_interface.set_aligned_starting_time(starting_time + time_shift)

            # Shift video timestamps
            if "Video" in self.data_interface_objects:
                video_interface = self.data_interface_objects["Video"]
                video_timestamps = video_interface.get_original_timestamps()
                video_interface.set_aligned_timestamps(video_timestamps + time_shift)
```

### Real-world example: Sync channel alignment (giocomo wen22)

The wen22 conversion computes an offset between behavioral timestamps and neural recording timestamps using an NI-DAQ sync channel:

```python
def calculate_behavioral_offset_with_nidq_channel(self, df_epochs):
    """Calculate offset between behavioral timestamps and NIDQ sync pulses."""
    session_path = Path(self.source_data["session_path"])
    nidq_file_path = session_path / f"{session_path.stem.replace('g0', 'g0_t0')}.nidq.bin"

    if nidq_file_path.is_file():
        nidq_extractor = SpikeGLXRecordingExtractor(session_path, stream_id="nidq")
        epoch_change_trace = nidq_extractor.get_traces(channel_ids=["nidq#XA2"]).ravel()
        times = nidq_extractor.get_times()

        # Binarize the sync signal
        epoch_change_trace_bin = np.zeros(epoch_change_trace.shape, dtype=int)
        epoch_change_trace_bin[epoch_change_trace > (np.max(epoch_change_trace) // 2)] = 1
        epoch_start_idxs = np.where(np.diff(epoch_change_trace_bin) > 0)[0]

        df_epochs["epoch_start_by_niqd"] = times[epoch_start_idxs][:df_epochs.shape[0]]
        offset = (df_epochs["start_time"] - df_epochs["epoch_start_by_niqd"]).mean()
        return offset
    return 0
```

Then all behavioral timestamps are shifted by this offset:
```python
df_position_data["timestamps"] -= offset_for_behavioral_time_stamps
```

### Alignment API summary

| Method | When to use |
|--------|-------------|
| `interface.get_original_timestamps()` | Get timestamps before any alignment |
| `interface.set_aligned_timestamps(timestamps)` | Replace all timestamps |
| `interface.set_aligned_starting_time(t)` | Shift starting time for regularly sampled data |
| `interface.set_aligned_interval_times(start_times, stop_times)` | Custom method for interval-based interfaces |

---

## 9. Common Utilities

### `load_dict_from_file`

Loads YAML or JSON files into a Python dict:

```python
from neuroconv.utils import load_dict_from_file

metadata = load_dict_from_file(Path("metadata.yaml"))
```

### `dict_deep_update`

Recursively merges two dicts. The second dict's values override the first's:

```python
from neuroconv.utils import dict_deep_update

base = {"NWBFile": {"lab": "old", "institution": "MIT"}}
override = {"NWBFile": {"lab": "new"}}
result = dict_deep_update(base, override)
# result = {"NWBFile": {"lab": "new", "institution": "MIT"}}
```

### `H5DataIO`

Wraps numpy arrays for HDF5 compression. Use this for large data arrays:

```python
from hdmf.backends.hdf5.h5_utils import H5DataIO

spatial_series = SpatialSeries(
    name="position",
    data=H5DataIO(position_data, compression="gzip"),
    timestamps=timestamps,
    reference_frame="unknown",
    unit="m",
)
```

### `get_module`

Gets or creates a processing module in an NWB file:

```python
from neuroconv.tools.nwb_helpers import get_module

# Gets existing "behavior" module or creates it
behavior_module = get_module(nwbfile, "behavior")

# Then add data interfaces to it
behavior_module.add(my_time_series)
```

Or create manually:
```python
if "behavior" not in nwbfile.processing:
    behavior_module = nwbfile.create_processing_module(
        name="behavior", description="Contains behavior data"
    )
else:
    behavior_module = nwbfile.processing["behavior"]
```

### `DeepDict`

The metadata type used throughout NeuroConv. Behaves like a nested defaultdict:

```python
from neuroconv.utils import DeepDict

metadata = DeepDict()
metadata["NWBFile"]["lab"] = "My Lab"  # Auto-creates nested structure
```

---

## 10. Testing Patterns

### stub_test

The primary testing mechanism during development. Every `session_to_nwb` function should accept `stub_test: bool`:

```python
def session_to_nwb(..., stub_test: bool = False):
    if stub_test:
        output_dir_path = output_dir_path / "nwb_stub"
    # ...
    conversion_options.update(dict(Recording=dict(stub_test=stub_test)))
```

Run it:
```python
session_to_nwb(data_dir_path=data_dir_path, output_dir_path=output_dir_path, stub_test=True)
```

This produces a small NWB file (usually a few MB) that can be quickly inspected.

### nwbinspector

After conversion, validate with nwbinspector:

```bash
# Command line
nwbinspector /path/to/output.nwb

# Or in Python
from nwbinspector import inspect_nwbfile
results = list(inspect_nwbfile(nwbfile_path="/path/to/output.nwb"))
for result in results:
    print(result)
```

Common issues nwbinspector catches:
- Missing required fields (session_description, session_start_time, identifier)
- Timezone-naive datetimes (session_start_time must have timezone)
- Subject fields not matching controlled vocabularies
- Data without units
- Empty containers

### CI test (test-install.yml)

The GitHub Actions workflow tests that the package can be installed and imported:

```yaml
name: Installation
on:
  workflow_dispatch:
  schedule:
    - cron: "0 0 1 * *"  # Monthly

jobs:
  run:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: ["ubuntu-latest", "macos-latest", "windows-latest"]
        python-version: ["3.12"]
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-python@v5
      with:
        python-version: ${{ matrix.python-version }}
    - run: pip install -e .
    - run: python -c "import <lab>_lab_to_nwb"
```

### Manual validation workflow

1. Run `session_to_nwb()` with `stub_test=True`
2. Open the stub NWB file with `pynwb` or NWB Widgets to visually inspect
3. Run `nwbinspector` on the stub file
4. Fix any issues
5. Run `session_to_nwb()` with `stub_test=False` on one real session
6. Run `nwbinspector` on the full file
7. Run `dataset_to_nwb()` for batch conversion

---

## Appendix A: Supporting Files

### make_env.yml

```yaml
name: <lab>_lab_to_nwb_env
channels:
- conda-forge
- defaults
dependencies:
- python>=3.11
- pip
- pip:
  - --editable .
```

### .pre-commit-config.yaml

```yaml
repos:
-   repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
    -   id: check-yaml
    -   id: end-of-file-fixer
    -   id: trailing-whitespace

-   repo: https://github.com/psf/black
    rev: 25.1.0
    hooks:
    -   id: black
        exclude: ^docs/

- repo: https://github.com/astral-sh/ruff-pre-commit
  rev: v0.11.2
  hooks:
  - id: ruff
    args: [ --fix ]

- repo: https://github.com/codespell-project/codespell
  rev: v2.4.1
  hooks:
  - id: codespell
    additional_dependencies:
    - tomli
```

### auto-publish.yml

```yaml
name: Upload Package to PyPI
on:
  release:
    types: [published]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: |
          python -m pip install --upgrade pip build
          python -m build
      - uses: pypa/gh-action-pypi-publish@v1.4.2
        with:
          verbose: true
          user: __token__
          password: ${{ secrets.PYPI_API_TOKEN }}
```

---

## Appendix B: Checklist for Generating a New Repo

1. Create the directory structure as shown in Section 1
2. Generate `pyproject.toml` with hatchling build system and correct package name
3. Create `make_env.yml`, `.pre-commit-config.yaml`, `.gitignore`
4. Copy the GitHub Actions workflows (`test-install.yml`, `auto-publish.yml`)
5. Write the `metadata.yaml` with all known lab/experiment metadata
6. Identify which built-in NeuroConv interfaces match each data modality
7. Write custom `BaseDataInterface` subclasses for data types without built-in interfaces
8. Write the `NWBConverter` class with all interfaces in `data_interface_classes`
9. If temporal alignment is needed, override `temporally_align_data_interfaces()`
10. Write `convert_session.py` following the source_data / conversion_options / metadata layering pattern
11. Write `convert_all_sessions.py` with the ProcessPoolExecutor pattern
12. Test with `stub_test=True`
13. Validate with `nwbinspector`
14. Write the README with installation and usage instructions

---

## Appendix C: NWB Containers Quick Reference

When writing custom interfaces, you need to know which PyNWB types to use:

| Data type | PyNWB class | Where to add it |
|-----------|-------------|-----------------|
| Raw electrophysiology | `ElectricalSeries` | `nwbfile.add_acquisition()` |
| LFP | `LFP` containing `ElectricalSeries` | `ecephys` processing module |
| Spike times | `Units` | `nwbfile.units` |
| Position | `Position` containing `SpatialSeries` | `behavior` processing module |
| Behavioral time series | `TimeSeries` | `behavior` processing module |
| Behavioral events | `TimeIntervals` | `behavior` processing module or `nwbfile.add_stimulus()` |
| Trials | built-in | `nwbfile.add_trial()` with `nwbfile.add_trial_column()` |
| Epochs | built-in | `nwbfile.add_epoch()` with `nwbfile.add_epoch_column()` |
| Calcium imaging | `OnePhotonSeries` or `TwoPhotonSeries` | `nwbfile.add_acquisition()` |
| ROI segmentation | `PlaneSegmentation` in `ImageSegmentation` | `ophys` processing module |
| Fluorescence traces | `RoiResponseSeries` in `Fluorescence` or `DfOverF` | `ophys` processing module |
| Stimulus events | `TimeIntervals` | `nwbfile.add_stimulus()` |
| Sleep states | `TimeIntervals` | custom processing module (e.g., `sleep`) |
