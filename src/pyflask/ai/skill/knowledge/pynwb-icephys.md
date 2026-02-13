# Intracellular Electrophysiology (icephys) — PyNWB Patterns

Construction patterns for patch clamp / intracellular recording data.

## Device + Electrode

```python
from pynwb.icephys import IntracellularElectrode

device = nwbfile.create_device(
    name="Amplifier",
    description="MultiClamp 700B",
    manufacturer="Molecular Devices",
)

electrode = nwbfile.create_icephys_electrode(
    name="electrode_0",
    description="Patch clamp electrode",
    device=device,
)
```

## Recording Series Types

**CurrentClampSeries** — response recorded during current injection:
```python
from pynwb.icephys import CurrentClampSeries

cc_response = CurrentClampSeries(
    name="current_clamp_response",
    data=voltage_trace,          # recorded voltage (numpy array)
    electrode=electrode,
    rate=20000.0,                # sampling rate in Hz
    unit="volts",
    gain=1.0,
    stimulus_description="step_protocol",
    sweep_number=np.uint32(0),   # optional, for grouping sweeps
)
nwbfile.add_acquisition(cc_response)
```

**CurrentClampStimulusSeries** — the injected current waveform:
```python
from pynwb.icephys import CurrentClampStimulusSeries

cc_stimulus = CurrentClampStimulusSeries(
    name="current_clamp_stimulus",
    data=current_waveform,       # injected current (numpy array)
    electrode=electrode,
    rate=20000.0,
    unit="amperes",
    gain=1.0,
    sweep_number=np.uint32(0),
)
nwbfile.add_stimulus(cc_stimulus)
```

**VoltageClampSeries** — response recorded during voltage clamp:
```python
from pynwb.icephys import VoltageClampSeries

vc_response = VoltageClampSeries(
    name="voltage_clamp_response",
    data=current_trace,          # recorded current
    electrode=electrode,
    rate=20000.0,
    unit="amperes",
    gain=1.0,
    stimulus_description="voltage_step",
)
nwbfile.add_acquisition(vc_response)
```

**VoltageClampStimulusSeries** — the command voltage:
```python
from pynwb.icephys import VoltageClampStimulusSeries

vc_stimulus = VoltageClampStimulusSeries(
    name="voltage_clamp_stimulus",
    data=voltage_command,
    electrode=electrode,
    rate=20000.0,
    unit="volts",
    gain=1.0,
)
nwbfile.add_stimulus(vc_stimulus)
```

**IZeroClampSeries** — recording with no current injection (I=0 mode):
```python
from pynwb.icephys import IZeroClampSeries

izero = IZeroClampSeries(
    name="izero_response",
    data=voltage_trace,
    electrode=electrode,
    rate=20000.0,
    unit="volts",
    stimulus_description="I=0",
)
nwbfile.add_acquisition(izero)
```

## Notes

- **Sweep tables are deprecated.** Use `sweep_number` on individual series to group
  stimulus/response pairs from the same sweep, but do not use IntracellularRecordingsTable
  or the higher-level sweep table hierarchy.
- Each electrode represents a physical pipette. Multiple sweeps use the same electrode.
- Stimulus and response series should be paired: for each stimulus series, there should
  be a corresponding acquisition series recorded from the same electrode.
- `gain` is the amplifier gain (float). Set to `1.0` if gain is already applied to data.

## Metadata YAML Template

```yaml
Icephys:
  Device:
    - name: Amplifier
      description: MultiClamp 700B patch clamp amplifier
      manufacturer: Molecular Devices
  IntracellularElectrode:
    - name: electrode_0
      description: Borosilicate glass pipette, 3-5 MOhm
```
