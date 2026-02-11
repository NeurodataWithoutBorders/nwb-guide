# Anatomical Localization — ndx-anatomical-localization Patterns

Construction patterns using `ndx-anatomical-localization` (v0.1.0+).
Standardized storage of anatomical coordinates for electrodes and imaging planes
against reference atlases (e.g., Allen CCFv3).

## Installation

```bash
pip install ndx-anatomical-localization
```

Dependencies: `pynwb>=2.8.0`, `hdmf>=3.14.1`, Python >= 3.10

## Overview

The extension defines 5 types:

| Type | Purpose |
|------|---------|
| `Space` | Custom coordinate system (origin, units, orientation) |
| `AllenCCFv3Space` | Pre-configured Allen Mouse Brain CCFv3 space |
| `AnatomicalCoordinatesTable` | 3D coordinates for point entities (electrodes) |
| `AnatomicalCoordinatesImage` | Pixel-to-coordinate mapping for imaging planes |
| `Localization` | LabMetaData container grouping all localization data |

## AllenCCFv3Space

Pre-configured coordinate system for the Allen Mouse Brain Common Coordinate Framework v3:

```python
from ndx_anatomical_localization import AllenCCFv3Space

ccf_space = AllenCCFv3Space()
# Fixed properties:
#   orientation: "PIR" (positive x=Posterior, y=Inferior, z=Right)
#   units: "um"
#   origin: "Anterior-Superior-Left corner of the 3D image volume"
#   extent: [13200.0, 8000.0, 11400.0] um (AP × DV × ML)
#   resolution: 10 um isotropic
```

## Custom Space

For non-Allen atlases or custom coordinate systems:

```python
from ndx_anatomical_localization import Space

space = Space(
    name="BregmaSpace",
    space_name="BregmaSpace",
    origin="bregma",
    units="um",
    orientation="RAS",  # positive x=Right, y=Anterior, z=Superior
)
```

**Orientation codes** — 3-letter string, one from each pair:
- A/P (Anterior/Posterior)
- L/R (Left/Right)
- S/I (Superior/Inferior)

Examples: `"RAS"`, `"PIR"`, `"LPI"`

## Electrode Localization (AnatomicalCoordinatesTable)

The primary use case — localizing electrodes to atlas coordinates:

```python
from ndx_anatomical_localization import (
    AnatomicalCoordinatesTable,
    AllenCCFv3Space,
    Localization,
)

# 1. Create Localization container
localization = Localization()
nwbfile.add_lab_meta_data([localization])

# 2. Add coordinate space
ccf_space = AllenCCFv3Space()
localization.add_spaces([ccf_space])

# 3. Create coordinates table referencing the electrodes table
coords = AnatomicalCoordinatesTable(
    name="AllenCCFv3Coordinates",
    target=nwbfile.electrodes,
    description="Electrode locations in Allen CCFv3",
    method="SHARP-Track 1.0",
    space=ccf_space,
)

# 4. Add one row per electrode
for i in range(len(nwbfile.electrodes)):
    coords.add_row(
        x=ccf_x[i],           # AP coordinate in um
        y=ccf_y[i],           # DV coordinate in um
        z=ccf_z[i],           # ML coordinate in um
        brain_region="CA1",   # optional
        localized_entity=i,   # index into electrodes table
    )

localization.add_anatomical_coordinates_tables([coords])
```

### Partial Localization

Not all electrodes need coordinates — only add rows for localized ones:

```python
for electrode_id in [0, 2, 5, 8]:  # only 4 of 16 electrodes
    coords.add_row(
        x=ccf_x[electrode_id],
        y=ccf_y[electrode_id],
        z=ccf_z[electrode_id],
        brain_region=regions[electrode_id],
        localized_entity=electrode_id,
    )
```

## Imaging Plane Registration (AnatomicalCoordinatesImage)

For registering a 2D imaging field of view to atlas coordinates:

```python
from ndx_anatomical_localization import AnatomicalCoordinatesImage
import numpy as np

image_coords = AnatomicalCoordinatesImage(
    name="ImagingPlaneLocalization",
    imaging_plane=nwbfile.imaging_planes["ImagingPlane"],
    method="manual registration",
    space=ccf_space,
    x=x_grid,                          # shape: (height, width)
    y=y_grid,                          # shape: (height, width)
    z=z_grid,                          # shape: (height, width)
    brain_region=region_labels,         # optional, shape: (height, width)
)

localization.add_anatomical_coordinates_images([image_coords])
```

For static images (e.g., histology) use `image=` instead of `imaging_plane=`:

```python
from pynwb.image import GrayscaleImage

histology_img = GrayscaleImage(
    name="histology_slice",
    data=slice_data,
    description="Nissl-stained coronal section",
)

image_coords = AnatomicalCoordinatesImage(
    name="HistologyLocalization",
    image=histology_img,               # use image= instead of imaging_plane=
    method="manual registration to CCF",
    space=ccf_space,
    x=x_coords, y=y_coords, z=z_coords,
)
```

**Constraint:** Exactly one of `image` or `imaging_plane` must be provided.

## Multiple Localizations

Store multiple localizations (different methods, different spaces) in one file:

```python
localization = Localization()
nwbfile.add_lab_meta_data([localization])

ccf_space = AllenCCFv3Space()
bregma_space = Space(name="Bregma", space_name="Bregma",
                     origin="bregma", units="um", orientation="RAS")
localization.add_spaces([ccf_space, bregma_space])

# Manual annotation in bregma coordinates
manual = AnatomicalCoordinatesTable(
    name="ManualLocalization",
    target=nwbfile.electrodes,
    method="manual annotation",
    space=bregma_space,
)

# Automated registration to CCF
automated = AnatomicalCoordinatesTable(
    name="SHARPTrackLocalization",
    target=nwbfile.electrodes,
    method="SHARP-Track 2.0",
    space=ccf_space,
)

# ... add rows to each ...

localization.add_anatomical_coordinates_tables([manual, automated])
```

## Reading Back

```python
from pynwb import NWBHDF5IO

with NWBHDF5IO("data.nwb", "r", load_namespaces=True) as io:
    nwbfile = io.read()
    localization = nwbfile.lab_meta_data["localization"]
    coords = localization.anatomical_coordinates_tables["AllenCCFv3Coordinates"]

    x = coords["x"].data[:]
    y = coords["y"].data[:]
    z = coords["z"].data[:]
    regions = coords["brain_region"].data[:]
    electrode_ids = coords["localized_entity"].data[:]
```

## Notes

- The `Localization` container is added via `nwbfile.add_lab_meta_data([localization])`.
- `AllenCCFv3Space` uses **PIR** orientation: +x=Posterior, +y=Inferior, +z=Right.
  Bregma is approximately at (5400, 0, 5700) um in CCFv3 coordinates.
- `method` should describe the registration tool/approach (e.g., "SHARP-Track 1.0",
  "manual annotation", "Pinpoint", "brainreg").
- `brain_region` is optional but recommended — use Allen Brain Atlas ontology terms.
- For `AnatomicalCoordinatesImage`, coordinate arrays must match the image dimensions.
- This extension is currently v0.1.0 (beta) but is the recommended way to store
  anatomical localization data in NWB files.
