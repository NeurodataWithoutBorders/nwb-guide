## Phase 5: Code Generation

**Goal**: Generate a complete, pip-installable conversion repo following CatalystNeuro conventions.

**Entry**: You have complete experiment spec, interface mapping, metadata, and sync plan.

**Exit criteria**: A working repo with:
- Correct directory structure (cookiecutter pattern)
- `pyproject.toml` with proper dependencies
- NWBConverter class with all interfaces
- `convert_session.py` with full pipeline
- Custom DataInterface classes where needed
- `metadata.yaml` with all collected metadata
- `convert_all_sessions.py` for batch conversion

### Step 1: Scaffold the Repository

Create the standard directory structure INSIDE the repo that was cloned in Phase 1
(`nwb-conversions/<lab-name>-to-nwb/`). All files below are relative to the repo root:

```
./                              ← repo root (already cloned from Phase 1)
├── .gitignore                  ← already created in Phase 1
├── pyproject.toml
├── README.md
├── make_env.yml
└── src/
    └── <lab_name>_to_nwb/
        ├── __init__.py
        └── <conversion_name>/
            ├── __init__.py
            ├── <conversion_name>nwbconverter.py
            ├── convert_session.py
            ├── convert_all_sessions.py
            ├── metadata.yaml
            └── <custom_interface_name>.py  (if needed)
```

### Step 2: Write pyproject.toml

```toml
[project]
name = "<lab-name>-lab-to-nwb"
version = "0.0.1"
description = "NWB conversion scripts for the <Lab> Lab."
readme = "README.md"
requires-python = ">=3.11"
license = { text = "MIT" }
authors = [{ name = "CatalystNeuro", email = "ben.dichter@catalystneuro.com" }]
dependencies = ["neuroconv", "nwbinspector"]

[project.optional-dependencies]
<conversion_name> = [
    "neuroconv[<extras>]==<pinned_version>",
    # Add any additional deps needed for custom interfaces
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build]
include = ["*.yaml", "*.yml", "*.json"]

[tool.hatch.build.targets.wheel]
packages = ["src/<lab_name>_lab_to_nwb"]
```

**Extras for NeuroConv** depend on which interfaces are used:
- SpikeGLX: `neuroconv[spikeglx]`
- OpenEphys: `neuroconv[openephys]`
- Phy: `neuroconv[phy]`
- Suite2p: `neuroconv[suite2p]`
- DeepLabCut: `neuroconv[deeplabcut]`
- Check NeuroConv's pyproject.toml for all available extras

### Step 3: Write the NWBConverter Class

```python
from neuroconv import NWBConverter
from neuroconv.datainterfaces import (
    # Import NeuroConv interfaces based on interface mapping
)
# Import custom interfaces
from .<custom_module> import CustomInterface


class <ConversionName>NWBConverter(NWBConverter):
    """Primary conversion class."""

    data_interface_classes = dict(
        # Map logical names to interface classes
        # Names should be descriptive: Recording, LFP, Sorting, Behavior, etc.
    )

    def temporally_align_data_interfaces(self):
        """Override if sync logic is needed."""
        # Implement sync plan from Phase 4
        pass
```

### Step 3b: Check Registry for Reusable Custom Interfaces

Before writing a custom interface from scratch, check the conversion registry for
similar custom interfaces from prior conversions. A prior interface that handles the
same data format or creates the same NWB types can serve as a starting template.

```python
import yaml

with open("/tmp/registry.yaml") as f:
    registry = yaml.safe_load(f)

# Search for conversions with custom interfaces that match what we need
needed_nwb_types = ["Position", "BehavioralEvents"]  # what our custom data maps to
for conv in registry.get("conversions", []):
    if not conv.get("has_custom_interfaces"):
        continue
    # The full manifest has custom_interfaces detail — fetch it from the repo
    print(f"Check {conv['repo']} for custom interfaces")
```

If a match is found, fetch the actual interface code from the prior repo via the API:
```bash
NWB_API="https://nwb-conversions-api.ben-dichter.workers.dev"
curl -sf "${NWB_API}/repos/<repo-name>/files/<path-to-interface>"
```

Use the fetched code as a starting template, adapting it to the current lab's file format
and column names. Give credit in a comment: `# Adapted from nwb-conversions/<repo-name>`.

If no match is found, write the custom interface from scratch (Step 4 below).

### Step 4: Write Custom DataInterface Classes

For each data stream that needs custom code:

```python
from neuroconv.basedatainterface import BaseDataInterface
from neuroconv.utils import DeepDict
from pynwb.file import NWBFile


class <Name>Interface(BaseDataInterface):
    """Interface for reading <description>."""

    keywords = ["<modality>"]

    def __init__(self, file_path: str):
        """
        Parameters
        ----------
        file_path : str
            Path to the <format> file.
        """
        super().__init__(file_path=file_path)

    def get_metadata(self) -> DeepDict:
        metadata = super().get_metadata()
        # Extract any metadata from the file
        return metadata

    def add_to_nwbfile(self, nwbfile: NWBFile, metadata: dict, **kwargs):
        # Read data from self.source_data["file_path"]
        # Create appropriate PyNWB objects
        # Add to nwbfile
        pass
```

#### Custom Interface Guidelines

**Metadata responsibility**: A custom interface's `get_metadata()` should only return
metadata that can be extracted FROM THE DATA FILE ITSELF (e.g., session date from filename,
frame rate from timestamps). Lab-level metadata (institution, experimenter) and subject
metadata (species, genotype) should be handled in `convert_session.py` via metadata YAML
and subject metadata files. Do not duplicate metadata loading between the interface and
the conversion script.

**Use `conversion` parameter, not data transformation**: When data is in non-SI units
(e.g., centimeters), do NOT multiply the data by a conversion factor. Instead, use the
`conversion` parameter on TimeSeries:
```python
# CORRECT: store raw data, use conversion factor
TimeSeries(name="position", data=pos_cm, unit="m", conversion=0.01)

# WRONG: transform data in-place
TimeSeries(name="position", data=pos_cm * 0.01, unit="m")
```
This preserves original data values in the file and is more NWB-idiomatic.

**Set `resolution` when unknown**: If you don't know the resolution (smallest meaningful
difference) of a data stream, explicitly set `resolution=-1.0`. Don't leave it unset.

**Pickle files cannot be lazily loaded.** Unlike HDF5 or binary files, pickle requires
reading the entire file into memory. This is an acceptable exception to the "load data
lazily in `__init__`" guideline. If the pickle is very large, consider loading only in
`add_to_nwbfile()` instead of `__init__()`.

**Choosing the right NWB types for custom data:**

Always use the most specific NWB type available — don't use bare `TimeSeries` when a
subtype exists. See `knowledge/nwb-best-practices.md` for the full set of conventions.

| Data Type | NWB Container | Where to Add |
|-----------|---------------|--------------|
| Continuous neural signal | `ElectricalSeries` | `nwbfile.add_acquisition()` |
| Position (x, y) | `Position` > `SpatialSeries` | `processing["behavior"]` |
| Running speed | `TimeSeries` | `processing["behavior"]` |
| Lick times | `TimeSeries` (binary) or ndx-events `Events` | `processing["behavior"]` |
| Trial info | `TimeIntervals` | `nwbfile.add_trial()` |
| Epochs | `TimeIntervals` | `nwbfile.add_epoch()` |
| Pupil tracking | `PupilTracking` > `TimeSeries` | `processing["behavior"]` |
| Eye position | `EyeTracking` > `SpatialSeries` | `processing["behavior"]` |
| Stimulus times | `TimeIntervals` | `nwbfile.add_stimulus()` |
| Fluorescence traces | `RoiResponseSeries` | `processing["ophys"]` |
| ROI masks | `PlaneSegmentation` | `processing["ophys"]` |
| Reward events | `TimeSeries` or `LabeledEvents` | `processing["behavior"]` |
| Animal video | `ImageSeries` (external_file) | `nwbfile.add_acquisition()` |
| Compass direction | `CompassDirection` > `SpatialSeries` | `processing["behavior"]` |
| Optogenetic stimulus | `OptogeneticSeries` | `nwbfile.add_stimulus()` |

**For detailed PyNWB construction patterns by domain, see:**
- `knowledge/pynwb-icephys.md` — intracellular electrophysiology
- `knowledge/pynwb-optogenetics.md` — optogenetic stimulation
- `knowledge/pynwb-ophys-advanced.md` — advanced optical physiology (ROIs, segmentation, motion correction)
- `knowledge/pynwb-behavior.md` — behavior container types (PupilTracking, EyeTracking, etc.)
- `knowledge/pynwb-images.md` — image data and external video files
- `knowledge/pynwb-advanced-io.md` — compression, chunking, iterative write for large data
- `knowledge/ndx-fiber-photometry.md` — ndx-fiber-photometry extension (REQUIRED for fiber photometry)
- `knowledge/ndx-pose.md` — ndx-pose extension for pose estimation (DeepLabCut, SLEAP, Lightning Pose)
- `knowledge/ndx-anatomical-localization.md` — ndx-anatomical-localization for electrode/imaging plane atlas registration

**Single-photon vs. two-photon imaging:**
Miniscope data (UCLA Miniscope, Inscopix nVista/nVoke) is **single-photon** (one-photon)
imaging and MUST use `OnePhotonSeries`, not `TwoPhotonSeries`. Two-photon imaging
(ScanImage, Scanbox, Bruker, Prairie) uses `TwoPhotonSeries`. Getting this wrong is a
common mistake. Check:
- Miniscope → `OnePhotonSeries` (via `MiniscopeImagingInterface`)
- Inscopix → `OnePhotonSeries` (via `InscopixImagingInterface`)
- ScanImage, Scanbox, Bruker → `TwoPhotonSeries`
- If unsure, ask the user whether their microscope uses one-photon or two-photon excitation.

**Key constraints on SpatialSeries:**
- Only for position data (x, y, z). Velocity and acceleration should use `TimeSeries`.
- Must have 1, 2, or 3 data columns (not more).
- When inside `CompassDirection`, units must be `"degrees"` or `"radians"`.
- When using degrees, data values should be in [-360, 360]; radians in [-2pi, 2pi].

#### Behavioral vs. Stimulus Data

When a dataset has both behavioral and stimulus columns (common in VR experiments),
separate them:

**Behavioral data** → `processing["behavior"]` via `BehavioralTimeSeries`, `Position`, etc.:
- Position / spatial location
- Running speed / velocity
- Lick events / lick rate
- Eye position / pupil diameter
- Pose estimation keypoints

**Stimulus data** → `nwbfile.add_stimulus()`:
- Visual stimulus parameters (contrast, orientation, spatial frequency)
- Environment parameters (morph value, jitter)
- Optogenetic stimulus waveforms
- Auditory stimulus parameters

**Reward** can go in either, but prefer `processing["behavior"]` if it represents the
animal's experience (reward delivery events), or `nwbfile.add_stimulus()` if it represents
an experimenter-controlled parameter.

**Use `get_module()` to get or create processing modules:**
```python
from neuroconv.tools.nwb_helpers import get_module
behavior_module = get_module(nwbfile, "behavior", "Processed behavioral data")
behavior_module.add(my_container)
```

**Use `H5DataIO` for compression:**
```python
from hdmf.backends.hdf5.h5_utils import H5DataIO
data_compressed = H5DataIO(data=my_array, compression="gzip")
```

#### Time Series Best Practices (from NWB Inspector)

Follow these in every custom interface and `add_to_nwbfile()` method:

1. **Time-first orientation**: data shape must be `(n_timepoints, ...)`. If source data is
   `(channels, timepoints)`, transpose before adding: `data = data.T`
2. **Timestamps in seconds**: all timestamps are in seconds relative to `session_start_time`.
3. **Ascending, non-negative, no NaN**: timestamps must be sorted ascending, >= 0, no NaN.
4. **Use `rate` for regular sampling**: if the signal has a constant sampling rate, use
   `rate=<Hz>` and `starting_time=<seconds>` instead of a `timestamps` array.
5. **SI units via `conversion`**: set `unit` to the SI unit (e.g., `"m"`, `"V"`) and use
   `conversion` to express the factor from stored data to SI.
6. **Every text field must be meaningful**: no empty strings for `description`, `unit`, etc.
7. **Breaks in recording**: if there are gaps, use explicit `timestamps` (not `rate`) or
   create separate TimeSeries objects per continuous segment.

#### Table Best Practices

When creating DynamicTable objects (trials, epochs, electrodes, custom tables):

- **Boolean columns**: name with `is_` prefix (e.g., `is_correct`, `is_rewarded`)
- **Timing columns**: name with `_time` suffix (e.g., `start_time`, `reward_time`)
- **No JSON strings**: don't encode structured data as JSON in string columns
- **No empty tables**: don't create tables with zero rows
- **Unique IDs**: keep the default auto-incrementing `id` column

#### Ecephys Best Practices

When working with electrodes and spike sorting data:

- **Electrode `location` is required**: always fill it. Use Allen Brain Atlas terms for mice.
  Use `"unknown"` only if the region is truly unknown.
- **Don't duplicate metadata in electrodes table**: don't add `unit`, `gain`, or `offset`
  columns. Those belong on `ElectricalSeries` (as `channel_conversion` and `offset`).
- **Spike times must be ascending and positive**: verify sorted order, no negative values.
- **Use `obs_intervals`** on the units table if the recording has gaps.

#### Video Best Practices

- **Animal behavior videos** (webcam, running wheel cam): store as external files using
  `ImageSeries(external_file=[relative_path], ...)`. Use relative paths.
- **Neural imaging data** (two-photon, miniscope): store internally with lossless compression.
- **Don't set `starting_frame`** unless using `external_file`.

### Step 5: Write convert_session.py

Follow the standard pattern:

```python
from pathlib import Path
from typing import Union
from zoneinfo import ZoneInfo

from neuroconv.utils import load_dict_from_file, dict_deep_update

from <package>.<conversion> import <ConversionName>NWBConverter


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

    # Determine session_id and subject_id from path/filenames
    session_id = "..."
    subject_id = "..."
    nwbfile_path = output_dir_path / f"{session_id}.nwb"

    # Build source_data
    source_data = dict()
    conversion_options = dict()

    # Add each interface with its file paths
    source_data["Recording"] = dict(folder_path=str(data_dir_path / "..."))
    conversion_options["Recording"] = dict(stub_test=stub_test)

    # Conditionally add interfaces if files exist
    behavior_path = data_dir_path / "behavior.txt"
    if behavior_path.is_file():
        source_data["Behavior"] = dict(file_path=str(behavior_path))
        conversion_options["Behavior"] = dict()

    # Create converter
    converter = <ConversionName>NWBConverter(source_data=source_data)

    # Get and merge metadata
    metadata = converter.get_metadata()

    metadata_path = Path(__file__).parent / "metadata.yaml"
    editable_metadata = load_dict_from_file(metadata_path)
    metadata = dict_deep_update(metadata, editable_metadata)

    # Set session-specific metadata
    tz = ZoneInfo("<timezone>")
    if metadata["NWBFile"]["session_start_time"]:
        metadata["NWBFile"]["session_start_time"] = (
            metadata["NWBFile"]["session_start_time"].replace(tzinfo=tz)
        )
    metadata["NWBFile"]["session_id"] = session_id

    # Subject metadata — subject_id is required for DANDI
    metadata["Subject"]["subject_id"] = subject_id
    # Load per-subject metadata from file if available
    # See knowledge/nwb-best-practices.md for required formats:
    #   species: Latin binomial (e.g., "Mus musculus")
    #   sex: one of "M", "F", "U", "O"
    #   age: ISO 8601 duration (e.g., "P90D")
    #   weight: "numeric unit" (e.g., "0.025 kg")

    # Run conversion
    converter.run_conversion(
        nwbfile_path=nwbfile_path,
        metadata=metadata,
        conversion_options=conversion_options,
        overwrite=True,
    )


if __name__ == "__main__":
    # Example usage
    data_dir_path = Path("/path/to/data")
    output_dir_path = Path("/path/to/output")
    session_to_nwb(
        data_dir_path=data_dir_path,
        output_dir_path=output_dir_path,
        stub_test=True,  # Set to False for full conversion
    )
```

### Step 6: Write convert_all_sessions.py

```python
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
import traceback

from .convert_session import session_to_nwb


def get_session_to_nwb_kwargs_per_session(data_dir_path):
    """Discover all sessions and return kwargs for each."""
    # Implement session discovery logic
    # Return list of dicts, each with kwargs for session_to_nwb
    raise NotImplementedError("Implement session discovery")


def safe_session_to_nwb(**kwargs):
    """Wrapper that catches and logs exceptions."""
    exception_file_path = kwargs.pop("exception_file_path", None)
    try:
        session_to_nwb(**kwargs)
    except Exception:
        if exception_file_path:
            with open(exception_file_path, "w") as f:
                f.write(traceback.format_exc())
        else:
            raise


def dataset_to_nwb(
    data_dir_path,
    output_dir_path,
    max_workers=1,
    stub_test=False,
):
    data_dir_path = Path(data_dir_path)
    output_dir_path = Path(output_dir_path)
    exception_dir = output_dir_path / "exceptions"
    exception_dir.mkdir(parents=True, exist_ok=True)

    kwargs_list = get_session_to_nwb_kwargs_per_session(data_dir_path)

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        for kwargs in kwargs_list:
            kwargs["output_dir_path"] = output_dir_path
            kwargs["stub_test"] = stub_test
            session_id = kwargs.get("session_id", "unknown")
            kwargs["exception_file_path"] = str(exception_dir / f"{session_id}.txt")
            executor.submit(safe_session_to_nwb, **kwargs)
```

### Step 7: Write metadata.yaml

Use the metadata collected in Phase 3. See Phase 3 for format.

### Step 8: Write README.md

```markdown
# <lab-name>-lab-to-nwb

NWB conversion scripts for the [<Lab> Lab](lab_url) data,
using [NeuroConv](https://github.com/catalystneuro/neuroconv).

## Installation

```bash
pip install <lab-name>-lab-to-nwb
```

## Usage

### Single session
```python
from <package>.<conversion>.convert_session import session_to_nwb

session_to_nwb(
    data_dir_path="/path/to/session",
    output_dir_path="/path/to/output",
    stub_test=False,
)
```

### All sessions
```python
from <package>.<conversion>.convert_all_sessions import dataset_to_nwb

dataset_to_nwb(
    data_dir_path="/path/to/data",
    output_dir_path="/path/to/output",
    max_workers=4,
)
```
```

### Step 9: Commit and Push to nwb-conversions

After all code is generated and the repo is scaffolded, commit everything and push to the
`nwb-conversions` GitHub org. The remote was set up in Phase 1 via `gh repo create --clone`.

```bash
git add -A
git commit -m "Add conversion code for <conversion_name>

Generated by nwb-convert skill. Includes:
- NWBConverter with <N> interfaces
- <N> custom DataInterface classes
- convert_session.py and convert_all_sessions.py
- metadata.yaml with lab and experiment metadata"
if git remote get-url origin &>/dev/null; then git push; fi
```

This makes the conversion code immediately available in the org for reference by future
conversions. The manifest will be added in Phase 7 after DANDI upload is complete.
