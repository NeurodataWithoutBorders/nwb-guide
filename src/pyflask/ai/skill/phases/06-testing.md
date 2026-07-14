## Phase 6: Testing & Validation

**Goal**: Verify the conversion produces valid, complete NWB files.

**Entry**: You have generated all conversion code from Phase 5.

**Exit criteria**: The conversion runs successfully on at least one session, the output
passes nwbinspector validation, and the data can be read back correctly.

### Step 1: Install the Package

```bash
cd <repo_path>
pip install -e ".[<conversion_name>]"
```

### Step 2: Run a Stub Test

First, run with `stub_test=True` to convert a small subset of data quickly:

```python
from <package>.<conversion>.convert_session import session_to_nwb

session_to_nwb(
    data_dir_path="/path/to/sample/session",
    output_dir_path="/path/to/output",
    stub_test=True,
)
```

If this fails, debug the error:
- Import errors → missing dependencies in pyproject.toml
- File not found → incorrect source_data paths
- Type errors → incorrect data shapes or types in custom interfaces
- Schema validation errors → metadata doesn't match expected schema

### Step 3: Inspect the NWB File

Read back the file and verify contents:

```python
from pynwb import NWBHDF5IO

with NWBHDF5IO("/path/to/output/session.nwb", "r") as io:
    nwbfile = io.read()

    # Check basic metadata
    print(f"Session: {nwbfile.session_description}")
    print(f"Start time: {nwbfile.session_start_time}")
    print(f"Subject: {nwbfile.subject}")

    # Check acquisition data
    print(f"Acquisition: {list(nwbfile.acquisition.keys())}")

    # Check processing modules
    for name, module in nwbfile.processing.items():
        print(f"Processing/{name}: {list(module.data_interfaces.keys())}")

    # Check units
    if nwbfile.units:
        print(f"Units: {len(nwbfile.units)} units")

    # Check trials
    if nwbfile.trials:
        print(f"Trials: {len(nwbfile.trials)} trials")
        print(f"Trial columns: {nwbfile.trials.colnames}")

    # Check electrodes
    if nwbfile.electrodes:
        print(f"Electrodes: {len(nwbfile.electrodes)} electrodes")

    # Spot-check data values
    for name, ts in nwbfile.acquisition.items():
        if hasattr(ts, 'data'):
            print(f"  {name}: shape={ts.data.shape}, dtype={ts.data.dtype}")
```

### Step 4: Run NWB Inspector

**You MUST run nwbinspector on every converted file.** Do not skip this step or leave it for the user.

Run it via bash and capture the full output:

```bash
nwbinspector /path/to/output/session.nwb
```

Then analyze every message in the output. NWB Inspector reports issues at 4 severity levels:

| Level | Meaning | Action Required |
|-------|---------|-----------------|
| `CRITICAL_IMPORTANCE` | Will break downstream tools or DANDI upload | **Must fix before proceeding** |
| `BEST_PRACTICE_VIOLATION` | Violates NWB best practices | **Fix all of these** |
| `BEST_PRACTICE_SUGGESTION` | Could be improved | Fix if straightforward, otherwise note for the user |
| `PYNWB_VALIDATION` | PyNWB schema violations | **Must fix before proceeding** |

**For each issue reported, you must:**
1. Identify the root cause in the conversion code
2. Fix the code (metadata, interface, or convert_session.py)
3. Re-run the conversion (stub_test=True)
4. Re-run nwbinspector to confirm the fix

**Common issues and their fixes:**

| Inspector Message | Fix |
|-------------------|-----|
| `check_session_start_time_old_date` | Session start time is wrong or default — extract real date from source files |
| `check_session_start_time_future_date` | Timezone conversion error — verify ZoneInfo usage |
| `check_missing_text_for_session_description` | Add `session_description` to metadata.yaml or set it in convert_session.py |
| `check_subject_species_latin_binomial` | Use "Mus musculus" not "mouse", "Rattus norvegicus" not "rat" |
| `check_subject_species_form` | Species should be binomial (e.g., "Mus musculus") |
| `check_subject_age` | Format as ISO 8601 duration: "P90D" not "90 days" |
| `check_subject_sex` | Must be one of: "M", "F", "U", "O" |
| `check_data_orientation` | Time should be the first dimension. Transpose data if needed |
| `check_timestamps_match_first_dimension` | Length of timestamps must equal first dim of data |
| `check_regular_timestamps` | If data has constant rate, use `rate` + `starting_time` instead of `timestamps` |
| `check_timestamp_of_the_first_sample_is_not_negative` | Timestamps should start >= 0. Adjust offset |
| `check_missing_unit` | TimeSeries must have `unit` specified |
| `check_resolution` | Set resolution=-1.0 if unknown, otherwise provide actual resolution |
| `check_electrodes_table_global_ids_are_not_unique` | Electrode IDs must be unique across all probes |
| `check_empty_string_for_*` | Replace empty strings with actual descriptions |
| `check_imaging_plane_excitation_lambda` | Set `excitation_lambda` on ImagingPlane in metadata |
| `check_imaging_plane_indicator` | Set `indicator` on ImagingPlane (e.g., "GCaMP6f") |
| `check_imaging_plane_location` | Set `location` on ImagingPlane (e.g., "CA1") |
| `check_rate_is_not_zero` | TwoPhotonSeries must have nonzero `rate` — check Suite2p ops["fs"] |
| `check_plane_segmentation_image_mask_shape` | ROI masks must match imaging plane dimensions |
| `check_spatial_series_dims` | SpatialSeries must have 1, 2, or 3 data columns only |
| `check_compass_direction_unit` | CompassDirection SpatialSeries must use "degrees" or "radians" |
| `check_image_series_data_size` | Animal behavior videos should use external_file, not internal storage |
| `check_image_series_external_file_relative` | External file paths must be relative, not absolute |
| `check_no_empty_string_for_*` | All text fields (description, unit) must be non-empty |
| `check_timestamps_without_nans` | Timestamps must not contain NaN values |
| `check_timestamps_ascending` | Timestamps must be sorted in ascending order |
| `check_negative_spike_times` | All spike times must be >= 0 (session-aligned, not trial-aligned) |
| `check_ascending_spike_times` | Spike times within each unit must be in ascending order |
| `check_subject_exists` | NWBFile must have a Subject object |
| `check_subject_id_exists` | Subject must have subject_id set (required for DANDI) |
| `check_electrode_location` | Electrode location column must be filled (use "unknown" if needed) |

**Also run `dandi validate` if the user plans to upload to DANDI:**

```bash
dandi validate /path/to/output/
```

This catches DANDI-specific requirements beyond nwbinspector:
- `subject_id` must be set
- `session_id` must be set
- File naming conventions for DANDI organize

**Keep iterating until nwbinspector produces zero CRITICAL and zero BEST_PRACTICE_VIOLATION messages.**
Show the user the final clean nwbinspector output as confirmation.

### Step 5: Run Full Conversion (one session)

Once stub_test passes and nwbinspector is clean, run with `stub_test=False` on a single session:

```python
session_to_nwb(
    data_dir_path="/path/to/sample/session",
    output_dir_path="/path/to/output",
    stub_test=False,
)
```

Then run nwbinspector again on the full output — some issues only appear with real data
(e.g., data orientation problems, timestamp gaps, large uncompressed datasets).

### Step 6: Validate Data Integrity

For critical data streams, compare source and NWB values:

```python
import numpy as np

# Example: verify spike times
with NWBHDF5IO("output.nwb", "r") as io:
    nwbfile = io.read()
    nwb_spike_times = nwbfile.units["spike_times"][0]

# Compare with source
import spikeinterface.extractors as se
sorting = se.read_phy(phy_path)
source_spike_times = sorting.get_unit_spike_train(unit_id=0, return_times=True)

assert np.allclose(nwb_spike_times, source_spike_times, atol=1e-6)
```

### Step 7: Iterate

If any issues are found:
1. Fix the issue in the conversion code
2. Re-run the stub test
3. Re-run nwbinspector — confirm zero CRITICAL/BEST_PRACTICE_VIOLATION
4. Re-run full conversion
5. Re-validate
6. Repeat until clean

### Common Debugging Patterns

**Interface won't instantiate:**
- Check that file paths in source_data are correct
- Check that the file format is what you think it is
- Try instantiating the interface in isolation

**Data shapes are wrong:**
- Print the data shape at each step of custom interface
- Check if axes need to be transposed
- Check if time is first dimension (NWB convention)

**Timestamps don't make sense:**
- Check if timestamps are in seconds (NWB convention)
- Check timezone handling
- Print first/last timestamps and compare with expected session duration

**Metadata schema validation fails:**
- Print the metadata dict and compare with schema
- Check for required fields that are None or empty
- Check types (datetime vs string, list vs single value)

### Push Phase 6 Results

After all tests pass and nwbinspector is clean, commit any bug fixes and push:
```bash
git add -A
git commit -m "Phase 6: testing and validation — all checks passing

nwbinspector: 0 CRITICAL, 0 BEST_PRACTICE_VIOLATION
dandi validate: passed"
if git remote get-url origin &>/dev/null; then git push; fi
```
