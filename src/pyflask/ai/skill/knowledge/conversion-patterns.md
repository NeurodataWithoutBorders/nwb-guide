# Common Conversion Patterns from Real CatalystNeuro Repos

This document captures patterns observed across ~60 CatalystNeuro conversion repos.

## Pattern 1: Standard NeuroConv Pipeline (Most Common)

**Used by**: wen22, cai-lab, turner-lab, constantinople-lab, most modern repos

```python
class MyNWBConverter(NWBConverter):
    data_interface_classes = dict(
        Recording=SpikeGLXRecordingInterface,
        LFP=SpikeGLXLFPInterface,
        Sorting=PhySortingInterface,
        Behavior=CustomBehaviorInterface,
    )
```

Key characteristics:
- NWBConverter subclass with `data_interface_classes` dict
- Mix of built-in NeuroConv interfaces and custom ones
- `convert_session.py` builds source_data and conversion_options dicts
- Metadata layered: auto-extracted → YAML → programmatic overrides

## Pattern 2: ConverterPipe with Dynamic Interfaces

**Used by**: ibl-to-nwb, turner-lab (some conversions)

```python
from neuroconv import ConverterPipe

interfaces = []
interfaces.append(SpikeGLXRecordingInterface(folder_path=path))
if sorting_exists:
    interfaces.append(PhySortingInterface(folder_path=phy_path))
converter = ConverterPipe(data_interfaces=interfaces)
```

Used when:
- Interfaces need custom initialization (API clients, non-file sources)
- Session-dependent interface sets (not all sessions have all data)
- Pre-constructed interface instances needed

## Pattern 3: Raw PyNWB (Legacy / Highly Custom)

**Used by**: giocomo legacy, mallory21 freely-moving, older repos

```python
nwbfile = NWBFile(session_description=..., ...)
# Manually create PyNWB objects
position = Position(spatial_series=SpatialSeries(...))
nwbfile.create_processing_module("behavior").add(position)
with NWBHDF5IO(path, "w") as io:
    io.write(nwbfile)
```

Used when:
- Data is in highly processed/custom format (e.g., all-in-one .mat file)
- No NeuroConv interface exists and writing one isn't worth it
- Legacy code predating NeuroConv

## Pattern 4: Hybrid (NWBConverter + Direct PyNWB)

**Used by**: reimer-arenkiel-lab (DataJoint + TIFF)

The NWBConverter handles some data streams, then additional data is added
directly to the NWBFile via standalone functions:

```python
converter = MyConverter(source_data=source_data)
nwbfile = converter.create_nwbfile(metadata=metadata)
# Add more data directly
add_trials_from_database(nwbfile, session_key)
add_behavior_from_database(nwbfile, session_key)
configure_and_write_nwbfile(nwbfile, nwbfile_path)
```

## Pattern 5: Ophys with Suite2p + Custom Behavioral Data

**Used by**: giocomo-lab ophys (Plitt 2021)

When an ophys experiment has:
- Raw imaging in a proprietary format (Scanbox, ScanImage, Bruker)
- Suite2p segmentation output
- Custom behavioral data (pickle, .mat, CSV)

```python
class MyNWBConverter(NWBConverter):
    data_interface_classes = dict(
        Imaging=SbxImagingInterface,      # or ScanImageImagingInterface, BrukerTiffMultiPlaneImagingInterface
        Segmentation=Suite2pSegmentationInterface,
        Behavior=CustomBehaviorInterface,
    )
```

Key considerations:
- Suite2p and raw imaging share the same clock (frame-aligned)
- If behavioral data is logged per imaging frame, use `rate` + `starting_time` (no timestamps array)
- Compute rate as `rate = 1.0 / df["time"].diff().mean()` from the behavioral DataFrame
- Position data in VR: use `conversion=0.01` if data is in cm, set `unit="m"`
- Separate behavioral signals (position, speed, lick) from stimulus parameters (morph, contrast)
- Add behavioral data as `BehavioralTimeSeries` in `processing["behavior"]`
- Add stimulus data via `nwbfile.add_stimulus()`

Ophys metadata YAML should include device and imaging plane info:

```yaml
Ophys:
  Device:
    - name: Microscope
      description: Two-photon resonant scanning microscope
      manufacturer: Neurolabware  # or Bruker, Thorlabs, etc.
  ImagingPlane:
    - name: ImagingPlane
      description: Imaging plane in hippocampal CA1
      excitation_lambda: 920.0
      indicator: GCaMP6f
      location: CA1
  TwoPhotonSeries:
    - name: TwoPhotonSeries
      description: Two-photon calcium imaging data
```

## Common Custom Interface Patterns

### Reading MATLAB .mat files

```python
# For MATLAB v7.3+ (HDF5-based)
import h5py
with h5py.File(file_path, "r") as f:
    data = f["variable_name"][:]

# For older MATLAB files
from scipy.io import loadmat
mat = loadmat(file_path)
data = mat["variable_name"]

# For MATLAB v7.3 with complex nested structures
import hdf5storage
mat = hdf5storage.loadmat(file_path)
```

### Reading text/CSV behavior files

```python
import pandas as pd
# Tab-separated with no header
df = pd.read_csv(file_path, sep="\t", header=None,
                 names=["timestamp", "position", "extra1", "extra2"])

# Or numpy for simple numeric files
import numpy as np
data = np.loadtxt(file_path)
```

### Reading pickled DataFrames

```python
import pickle
with open(file_path, "rb") as f:
    data = pickle.load(f)
df = data["VR_Data"]  # or whatever key
```

**Pickle compatibility**: Pickles saved with older pandas versions may fail to load with
pandas >= 2.0 because `pandas.core.indexes.numeric` was removed. If you encounter
`ModuleNotFoundError: No module named 'pandas.core.indexes.numeric'`:
1. First try loading normally
2. If it fails, the user may need `pandas < 2.0` or to re-save the pickle with a newer version
3. Flag this to the user as a data compatibility issue — it is NOT a bug in the conversion code

### Creating Position data

```python
from pynwb.behavior import Position, SpatialSeries
from neuroconv.tools.nwb_helpers import get_module

position = Position()
position.create_spatial_series(
    name="virtual_position",
    data=pos_data,  # shape (n_timepoints,) or (n_timepoints, n_dims)
    timestamps=timestamps,  # or starting_time + rate
    unit="meters",
    reference_frame="Virtual track, 0=start, 2=end",
    conversion=0.01,  # if data is in cm, convert to meters
)

behavior_module = get_module(nwbfile, "behavior", "Processed behavioral data")
behavior_module.add(position)
```

### Creating Trial tables

```python
# Add custom columns first
nwbfile.add_trial_column(name="contrast", description="Visual contrast level")
nwbfile.add_trial_column(name="correct", description="Whether trial was correct")

# Then add each trial
for _, row in trials_df.iterrows():
    nwbfile.add_trial(
        start_time=row["start"],
        stop_time=row["stop"],
        contrast=row["contrast"],
        correct=row["correct"],
    )
```

### Creating Events (using ndx-events)

```python
from ndx_events import Events

lick_events = Events(
    name="lick_times",
    description="Times of lick events",
    timestamps=lick_timestamps,
)
behavior_module = get_module(nwbfile, "behavior")
behavior_module.add(lick_events)
```

### Using H5DataIO for compression

```python
from hdmf.backends.hdf5.h5_utils import H5DataIO

compressed_data = H5DataIO(data=large_array, compression="gzip")
ts = TimeSeries(name="my_data", data=compressed_data, ...)
```

## Synchronization Patterns from Real Repos

### wen22: NIDQ TTL-based offset

```python
from spikeinterface.extractors import SpikeGLXRecordingExtractor
import numpy as np

nidq = SpikeGLXRecordingExtractor(folder_path=spikeglx_path, stream_id="nidq")
signal = nidq.get_traces(channel_ids=["nidq#XA2"]).flatten()
binary = (signal > signal.max() / 2).astype(int)
rising_edges = np.where(np.diff(binary) > 0)[0]
ttl_times = rising_edges / nidq.get_sampling_frequency()

# Compare with behavioral epoch boundaries to get offset
offset = np.mean(ttl_times[:n] - behavioral_epoch_times[:n])
# Shift all behavioral timestamps
behavioral_timestamps += offset
```

### reimer-arenkiel: Multi-clock interpolation

```python
from scipy.interpolate import interp1d

# Map behavior clock → odor clock
interp_func = interp1d(
    behavior_scan_times,
    odor_scan_times[:len(behavior_scan_times)],
    kind="linear",
    fill_value="extrapolate",
)
aligned_times = interp_func(behavior_timestamps)
```

### ophys: Frame-rate inference from DataFrame

```python
# When behavioral data is logged per imaging frame
rate = 1.0 / df["time"].diff().mean()
# Use starting_time=0.0 and rate=rate for all behavioral time series
```

## Session Discovery Patterns

### Directory-based (most common)

```python
def get_session_to_nwb_kwargs_per_session(data_dir_path):
    sessions = []
    for session_dir in sorted(data_dir_path.iterdir()):
        if session_dir.is_dir() and not session_dir.name.startswith("."):
            sessions.append(dict(
                data_dir_path=str(session_dir),
                session_id=session_dir.name,
            ))
    return sessions
```

### File-pattern based

```python
import re
for mat_file in data_dir_path.glob("cell_info_session*.mat"):
    session_id = re.search(r"session(\d+)", mat_file.name).group(1)
    # Find matching SpikeGLX files
    spikeglx_path = find_matching_spikeglx(session_id)
    sessions.append(dict(
        processed_file=str(mat_file),
        spikeglx_path=str(spikeglx_path),
        session_id=session_id,
    ))
```

### Subject metadata from JSON/YAML

```python
import json
with open("subject_metadata.json") as f:
    all_subjects = json.load(f)
subject_info = all_subjects[subject_id]
metadata["Subject"].update(subject_info)
```

## Common File Organizations

### SpikeGLX standard layout
```
session_dir/
  session_g0/
    session_g0_imec0/
      session_g0_t0.imec0.ap.bin
      session_g0_t0.imec0.ap.meta
      session_g0_t0.imec0.lf.bin
      session_g0_t0.imec0.lf.meta
    session_g0_t0.nidq.bin
    session_g0_t0.nidq.meta
```

### Phy output layout
```
phy/
  params.py
  spike_times.npy
  spike_clusters.npy
  cluster_group.tsv  (or cluster_info.tsv)
  templates.npy
  ...
```

### Suite2p output layout
```
suite2p/
  plane0/
    stat.npy
    ops.npy
    F.npy
    Fneu.npy
    iscell.npy
    spks.npy
```

### ScanImage TIFF
```
session_dir/
  file_00001.tif
  file_00002.tif
  ...
  file_00001.tif.meta  (or embedded in TIFF headers)
```
