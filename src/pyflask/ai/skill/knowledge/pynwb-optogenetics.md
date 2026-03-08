# Optogenetics — PyNWB Patterns

Construction patterns for optogenetic stimulation data.

## Device + Stimulus Site

```python
device = nwbfile.create_device(
    name="Laser",
    description="473nm DPSS laser for ChR2 activation",
    manufacturer="Cobolt",
)

ogen_site = nwbfile.create_ogen_site(
    name="ogen_site",
    device=device,
    description="Fiber optic cannula targeting left mPFC",
    excitation_lambda=473.0,  # nm
    location="mPFC",          # brain region
)
```

## Optogenetic Series

```python
from pynwb.ogen import OptogeneticSeries

ogen_series = OptogeneticSeries(
    name="optogenetic_stimulus",
    data=laser_waveform,      # power in watts (numpy array, shape: n_timepoints)
    site=ogen_site,
    rate=10000.0,             # sampling rate of the stimulus waveform
    unit="watts",
    description="5ms pulses at 20Hz, 10mW",
)
nwbfile.add_stimulus(ogen_series)
```

For **event-based** stimulation (on/off times rather than continuous waveform):
```python
ogen_series = OptogeneticSeries(
    name="optogenetic_stimulus",
    data=pulse_amplitudes,     # power at each pulse
    timestamps=pulse_times,    # time of each pulse in seconds
    site=ogen_site,
    unit="watts",
)
nwbfile.add_stimulus(ogen_series)
```

## Notes

- Every `OptogeneticStimulusSite` must have at least one `OptogeneticSeries`.
  Don't create sites without corresponding stimulus data.
- `excitation_lambda` is the wavelength in nm (e.g., 473 for ChR2, 590 for NpHR,
  635 for Chrimson).
- `location` should use standard brain region names (Allen Brain Atlas for mice).
- Store the stimulus waveform, not just on/off times, when available.

## Metadata YAML Template

```yaml
Ogen:
  Device:
    - name: Laser
      description: 473nm DPSS laser
      manufacturer: Cobolt
  OptogeneticStimulusSite:
    - name: ogen_site
      description: Fiber optic cannula, 200um core, 0.39 NA
      excitation_lambda: 473.0
      location: mPFC
```
