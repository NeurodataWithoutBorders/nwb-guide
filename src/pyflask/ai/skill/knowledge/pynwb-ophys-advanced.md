# Optical Physiology (ophys) — Advanced PyNWB Patterns

Construction patterns beyond the basics in `nwb-best-practices.md`.

## ImagingPlane + OpticalChannel

```python
from pynwb.ophys import OpticalChannel

device = nwbfile.create_device(
    name="Microscope",
    description="Two-photon resonant scanning microscope",
    manufacturer="Bruker",
)

optical_channel = OpticalChannel(
    name="green",
    description="GCaMP emission channel",
    emission_lambda=520.0,
)

imaging_plane = nwbfile.create_imaging_plane(
    name="ImagingPlane",
    optical_channel=optical_channel,
    imaging_rate=30.0,
    description="Imaging plane in CA1",
    device=device,
    excitation_lambda=920.0,
    indicator="GCaMP6f",
    location="CA1",
    grid_spacing=[0.001, 0.001],       # meters per pixel (1 um/px)
    grid_spacing_unit="meters",
)
```

## TwoPhotonSeries vs OnePhotonSeries

```python
from pynwb.ophys import TwoPhotonSeries, OnePhotonSeries

# Two-photon (ScanImage, Scanbox, Bruker)
two_photon = TwoPhotonSeries(
    name="TwoPhotonSeries",
    data=image_data,             # shape: (n_frames, height, width)
    imaging_plane=imaging_plane,
    rate=30.0,
    unit="n.a.",
)
nwbfile.add_acquisition(two_photon)

# One-photon / widefield (Miniscope, Inscopix, widefield)
one_photon = OnePhotonSeries(
    name="OnePhotonSeries",
    data=image_data,
    imaging_plane=imaging_plane,
    rate=30.0,
    unit="n.a.",
)
nwbfile.add_acquisition(one_photon)
```

## PlaneSegmentation — ROI Masks

Three mask formats are supported. Use the one that matches your segmentation output:

**pixel_mask** — sparse format, best for small ROIs in large FOV:
```python
from pynwb.ophys import PlaneSegmentation, ImageSegmentation
from neuroconv.tools.nwb_helpers import get_module

img_seg = ImageSegmentation()
ophys_module = get_module(nwbfile, "ophys", "Optical physiology data")
ophys_module.add(img_seg)

plane_seg = img_seg.create_plane_segmentation(
    name="PlaneSegmentation",
    description="ROIs from Suite2p",
    imaging_plane=imaging_plane,
)

# Each ROI: list of (x, y, weight) tuples
for roi_mask in roi_masks:
    plane_seg.add_roi(pixel_mask=roi_mask)
    # roi_mask = [(x1, y1, w1), (x2, y2, w2), ...]
```

**image_mask** — dense format, one full-FOV mask per ROI:
```python
plane_seg = img_seg.create_plane_segmentation(
    name="PlaneSegmentation",
    description="ROIs from CaImAn",
    imaging_plane=imaging_plane,
)

for mask_2d in image_masks:
    plane_seg.add_roi(image_mask=mask_2d)
    # mask_2d shape: (height, width), same as imaging plane
```

## RoiResponseSeries — Fluorescence Traces

```python
from pynwb.ophys import RoiResponseSeries, DfOverF, Fluorescence

# Create a region referencing all (or some) ROIs
roi_table_region = plane_seg.create_roi_table_region(
    region=list(range(n_rois)),
    description="All ROIs",
)

# Raw fluorescence
fluorescence = Fluorescence()
ophys_module.add(fluorescence)
fluorescence.create_roi_response_series(
    name="RoiResponseSeries",
    data=F,                      # shape: (n_frames, n_rois)
    rois=roi_table_region,
    rate=30.0,
    unit="n.a.",
)

# dF/F
dff = DfOverF()
ophys_module.add(dff)
dff.create_roi_response_series(
    name="DfOverF",
    data=dff_data,               # shape: (n_frames, n_rois)
    rois=roi_table_region,
    rate=30.0,
    unit="n.a.",
)
```

## MotionCorrection

```python
from pynwb.ophys import MotionCorrection, CorrectedImageStack

corrected = CorrectedImageStack(
    corrected=corrected_two_photon,    # TwoPhotonSeries (corrected data)
    original=two_photon,                # TwoPhotonSeries (original data)
    xy_translation=TimeSeries(
        name="xy_translation",
        data=shifts,                    # shape: (n_frames, 2) — x,y shifts
        rate=30.0,
        unit="pixels",
    ),
)

motion_correction = MotionCorrection(corrected_image_stacks=[corrected])
ophys_module.add(motion_correction)
```

## Multi-Plane Imaging

For multi-plane imaging, create separate ImagingPlane, TwoPhotonSeries, and
PlaneSegmentation for each plane:

```python
for plane_idx in range(n_planes):
    ip = nwbfile.create_imaging_plane(
        name=f"ImagingPlane{plane_idx}",
        optical_channel=optical_channel,
        imaging_rate=volume_rate,
        device=device,
        excitation_lambda=920.0,
        indicator="GCaMP6f",
        location=f"CA1_plane{plane_idx}",
    )
    # Create TwoPhotonSeries and PlaneSegmentation per plane...
```
