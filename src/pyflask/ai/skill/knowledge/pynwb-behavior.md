# Behavior Containers — PyNWB Patterns

All behavior container types and when to use each.

## Container Selection Guide

| Data Type | Container | Child Type | Example |
|-----------|-----------|-----------|---------|
| Spatial position (x, y, z) | `Position` | `SpatialSeries` | Running on linear track |
| Continuous signals | `BehavioralTimeSeries` | `TimeSeries` | Running speed, lick rate |
| Irregular events | `BehavioralEvents` | `TimeSeries` | Lever presses at variable times |
| Pupil diameter | `PupilTracking` | `TimeSeries` | Eye tracking pupil size |
| Gaze position | `EyeTracking` | `SpatialSeries` | Eye tracking x,y position |
| Head direction | `CompassDirection` | `SpatialSeries` | Angular heading |

All containers go in `processing["behavior"]`.

## Position

```python
from pynwb.behavior import Position, SpatialSeries
from neuroconv.tools.nwb_helpers import get_module

position = Position()
position.create_spatial_series(
    name="animal_position",
    data=pos_xy,                # shape: (n_timepoints, 2)
    timestamps=timestamps,
    unit="meters",
    reference_frame="Top-left corner of arena",
    conversion=0.01,            # if data is in cm
)

behavior = get_module(nwbfile, "behavior", "Processed behavioral data")
behavior.add(position)
```

## BehavioralTimeSeries

For **continuous** behavioral signals sampled at regular intervals:

```python
from pynwb.behavior import BehavioralTimeSeries
from pynwb import TimeSeries

bts = BehavioralTimeSeries()
bts.create_timeseries(
    name="running_speed",
    data=speed,
    rate=30.0,
    unit="m/s",
    description="Treadmill running speed",
)
bts.create_timeseries(
    name="lick_rate",
    data=lick_rate,
    rate=30.0,
    unit="licks/s",
    description="Lick rate smoothed over 100ms",
)
behavior.add(bts)
```

## BehavioralEvents

For **irregularly timed** behavioral events:

```python
from pynwb.behavior import BehavioralEvents

be = BehavioralEvents()
be.create_timeseries(
    name="lever_presses",
    data=np.ones(n_presses),      # amplitude/value at each event
    timestamps=press_times,        # irregular timestamps
    unit="n.a.",
    description="Times of lever press events",
)
behavior.add(be)
```

## PupilTracking

```python
from pynwb.behavior import PupilTracking

pt = PupilTracking()
pt.create_timeseries(
    name="pupil_diameter",
    data=pupil_diam,
    rate=60.0,
    unit="meters",
    conversion=1e-3,              # if data is in mm
    description="Pupil diameter from DeepLabCut",
)
behavior.add(pt)
```

## EyeTracking

```python
from pynwb.behavior import EyeTracking, SpatialSeries

et = EyeTracking()
et.create_spatial_series(
    name="gaze_position",
    data=gaze_xy,                 # shape: (n_timepoints, 2)
    rate=60.0,
    unit="meters",
    reference_frame="Screen center",
    description="Gaze position from eye tracker",
)
behavior.add(et)
```

## CompassDirection

```python
from pynwb.behavior import CompassDirection, SpatialSeries

cd = CompassDirection()
cd.create_spatial_series(
    name="head_direction",
    data=heading_angles,          # shape: (n_timepoints,)
    rate=30.0,
    unit="radians",              # must be "radians" or "degrees"
    reference_frame="0=East, pi/2=North",
)
behavior.add(cd)
```

## Notes

- `SpatialSeries` is only for position data (1-3 columns). For velocity, acceleration,
  or other derived signals, use `TimeSeries` inside `BehavioralTimeSeries`.
- `CompassDirection` data must be in `[-2pi, 2pi]` (radians) or `[-360, 360]` (degrees).
- Prefer `rate` + `starting_time` over `timestamps` for regularly sampled data.
