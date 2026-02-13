# Pose Estimation — ndx-pose Patterns

Construction patterns using the `ndx-pose` extension (v0.2.2+).
Use this for pose estimation data from DeepLabCut, SLEAP, Lightning Pose, etc.

## Installation

```bash
pip install ndx-pose
```

## Overview

The extension defines:
- **Skeleton** — body part nodes and their connections (edges)
- **PoseEstimationSeries** — per-keypoint x,y(,z) positions + confidence over time
- **PoseEstimation** — container grouping all keypoints from one video/algorithm
- **PoseTraining** — optional training data (annotated frames, ground truth)

## NeuroConv Integration

NeuroConv has built-in interfaces for the major pose estimation tools:
- `DeepLabCutInterface` — reads DLC `.h5` or `.csv` output
- `SLEAPInterface` — reads SLEAP `.slp` or `.nwb` output
- `LightningPoseInterface` — reads Lightning Pose output

**Prefer NeuroConv interfaces when available.** Only use raw ndx-pose construction
when data is in a custom format not supported by NeuroConv.

## Skeleton Definition

```python
from ndx_pose import Skeleton, Skeletons
import numpy as np

skeleton = Skeleton(
    name="mouse_skeleton",
    nodes=["nose", "left_ear", "right_ear", "neck", "body", "tail_base"],
    edges=np.array([
        [0, 3],  # nose → neck
        [1, 3],  # left_ear → neck
        [2, 3],  # right_ear → neck
        [3, 4],  # neck → body
        [4, 5],  # body → tail_base
    ], dtype="uint8"),
    subject=nwbfile.subject,  # optional
)

skeletons = Skeletons(skeletons=[skeleton])
```

- `nodes`: list of body part names (order matters — indices used in edges)
- `edges`: Nx2 uint8 array of 0-indexed node pairs

## PoseEstimationSeries — Per-Keypoint Data

```python
from ndx_pose import PoseEstimationSeries

nose = PoseEstimationSeries(
    name="nose",
    description="Nose keypoint tracked by DeepLabCut",
    data=nose_xy,                    # shape: (n_frames, 2) for 2D or (n_frames, 3) for 3D
    unit="pixels",
    reference_frame="(0,0) is top-left corner of video frame",
    timestamps=timestamps,           # or rate=30.0
    confidence=confidence_scores,    # shape: (n_frames,), values 0-1, optional
    confidence_definition="Softmax output of DeepLabCut network",
)

# Share timestamps across keypoints to save space
left_ear = PoseEstimationSeries(
    name="left_ear",
    description="Left ear keypoint",
    data=left_ear_xy,
    unit="pixels",
    reference_frame="(0,0) is top-left corner of video frame",
    timestamps=nose,                 # reference another series' timestamps
    confidence=left_ear_confidence,
    confidence_definition="Softmax output of DeepLabCut network",
)
```

## PoseEstimation — Container

```python
from ndx_pose import PoseEstimation
from neuroconv.tools.nwb_helpers import get_module

camera = nwbfile.create_device(
    name="BehaviorCamera",
    description="Side-view camera for pose tracking",
    manufacturer="Basler",
)

pose_estimation = PoseEstimation(
    name="PoseEstimation",
    pose_estimation_series=[nose, left_ear, right_ear, neck, body, tail_base],
    description="Pose estimation of freely moving mouse",
    original_videos=["behavior_video.mp4"],
    labeled_videos=["behavior_video_labeled.mp4"],       # optional
    dimensions=np.array([[640, 480]], dtype="uint16"),    # optional: height, width
    devices=[camera],                                     # optional
    scorer="DLC_resnet50_openfieldOct30shuffle1_1600",   # optional
    source_software="DeepLabCut",                         # optional
    source_software_version="2.3.8",                      # optional
    skeleton=skeleton,                                    # optional but recommended
)

behavior = get_module(nwbfile, "behavior", "Processed behavioral data")
behavior.add(skeletons)
behavior.add(pose_estimation)
```

## Complete Minimal Example

```python
import numpy as np
from ndx_pose import (
    Skeleton, Skeletons,
    PoseEstimationSeries, PoseEstimation,
)
from neuroconv.tools.nwb_helpers import get_module

# 1. Define skeleton
skeleton = Skeleton(
    name="mouse",
    nodes=["nose", "body", "tail"],
    edges=np.array([[0, 1], [1, 2]], dtype="uint8"),
)

# 2. Create series for each keypoint
n_frames = 1000
timestamps = np.linspace(0, 33.3, n_frames)  # 30 fps for ~33s

series_list = []
for node in skeleton.nodes:
    s = PoseEstimationSeries(
        name=node,
        description=f"Position of {node}",
        data=np.random.rand(n_frames, 2) * 512,
        unit="pixels",
        reference_frame="Top-left corner of 512x512 video",
        timestamps=timestamps if not series_list else series_list[0],
        confidence=np.random.rand(n_frames),
        confidence_definition="DLC likelihood",
    )
    series_list.append(s)

# 3. Create container
pose_est = PoseEstimation(
    name="PoseEstimation",
    pose_estimation_series=series_list,
    description="DeepLabCut pose estimation",
    source_software="DeepLabCut",
    skeleton=skeleton,
)

# 4. Add to NWB file
behavior = get_module(nwbfile, "behavior", "Behavioral data")
behavior.add(Skeletons(skeletons=[skeleton]))
behavior.add(pose_est)
```

## Multi-Camera / Multi-View

For multi-camera setups, create separate `PoseEstimation` containers per view:

```python
pose_side = PoseEstimation(
    name="PoseEstimation_side",
    pose_estimation_series=side_series,
    description="Side camera pose estimation",
    devices=[side_camera],
    skeleton=skeleton,
    source_software="DeepLabCut",
)

pose_top = PoseEstimation(
    name="PoseEstimation_top",
    pose_estimation_series=top_series,
    description="Top camera pose estimation",
    devices=[top_camera],
    skeleton=skeleton,
    source_software="DeepLabCut",
)

behavior.add(pose_side)
behavior.add(pose_top)
```

## Notes

- **One subject per NWB file.** For multi-animal tracking, create separate NWB files.
- `confidence` is optional (since v0.2.0) but recommended when available.
- `unit` is typically `"pixels"` for 2D video tracking. Use `"meters"` if coordinates
  have been calibrated to real-world units.
- Share timestamps across keypoints by passing a reference to another series.
- `source_software` should be one of: `"DeepLabCut"`, `"SLEAP"`, `"Lightning Pose"`,
  or the actual software name.
- Training data (`PoseTraining`) is rarely needed in conversion workflows — it's mainly
  for sharing annotated datasets used to train models.
