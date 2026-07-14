# Images — PyNWB Patterns

Patterns for static images and video references in NWB files.

## Static Images

```python
from pynwb.image import GrayscaleImage, RGBImage, RGBAImage, Images

# Single grayscale image (e.g., mean projection)
mean_img = GrayscaleImage(
    name="mean_projection",
    data=mean_array,             # shape: (height, width), dtype float or uint
    description="Mean fluorescence projection",
)

# RGB image (e.g., histology)
histology = RGBImage(
    name="histology",
    data=rgb_array,              # shape: (height, width, 3)
    description="Post-hoc histology image",
)

# Group related images
images = Images(
    name="reference_images",
    images=[mean_img, histology],
    description="Reference images for this session",
)
nwbfile.add_acquisition(images)
```

## ImageSeries — External Video Files

For behavioral videos, use `external_file` to reference videos alongside the NWB file.
This avoids re-encoding video data and preserves the original codec.

```python
from pynwb.image import ImageSeries

video = ImageSeries(
    name="behavior_video",
    external_file=["./videos/session01_cam1.avi"],  # relative path
    format="external",
    rate=30.0,
    starting_frame=[0],
    description="Side-view behavioral camera",
    unit="n.a.",
)
nwbfile.add_acquisition(video)
```

## Notes

- Use **relative paths** for `external_file` so the NWB file remains portable.
- `starting_frame` is a list with one entry per file in `external_file`.
- For neural imaging data (two-photon, miniscope), store data **inside** the NWB file
  using `TwoPhotonSeries`/`OnePhotonSeries`, not as external files.
- `GrayscaleImage` expects 2D arrays; `RGBImage` expects 3D with last dim = 3.
