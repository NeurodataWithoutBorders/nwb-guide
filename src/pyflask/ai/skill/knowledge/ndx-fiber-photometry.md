# Fiber Photometry — ndx-fiber-photometry Patterns

Construction patterns using the `ndx-fiber-photometry` extension (v0.2.4+).
This is the **required** extension for fiber photometry data — do not store
fiber photometry signals as plain TimeSeries.

## Installation

```bash
pip install ndx-fiber-photometry
```

Dependencies: `pynwb>=3.1.0`, `hdmf>=4.1.0`, `ndx-ophys-devices>=0.3.1`

## Overview

The extension defines a structured hierarchy:

1. **Devices** — optical fiber, excitation source, photodetector, filters, dichroic mirrors
2. **Biological components** — indicator (e.g., dLight1.1, GCaMP6f), viral vector, injection
3. **FiberPhotometryTable** — DynamicTable linking devices + indicator + brain region per channel
4. **FiberPhotometryResponseSeries** — TimeSeries holding fluorescence data, referencing table rows
5. **CommandedVoltageSeries** — optional voltage commands controlling excitation sources
6. **FiberPhotometry** — LabMetaData container wrapping everything

## Complete Construction Example

```python
from ndx_fiber_photometry import (
    FiberPhotometry,
    FiberPhotometryTable,
    FiberPhotometryResponseSeries,
    CommandedVoltageSeries,
    FiberPhotometryIndicators,
)
from ndx_ophys_devices import (
    ExcitationSource,
    OpticalFiber,
    Photodetector,
    BandOpticalFilter,
    DichroicMirror,
    Indicator,
)

# ── Step 1: Create Devices ──────────────────────────────────────────────

excitation_source = ExcitationSource(
    name="LED_465nm",
    description="Blue LED for dLight excitation",
    manufacturer="Doric Lenses",
    illumination_type="LED",
    excitation_wavelength_in_nm=465.0,
)
nwbfile.add_device(excitation_source)

excitation_source_isos = ExcitationSource(
    name="LED_405nm",
    description="Violet LED for isosbestic control",
    manufacturer="Doric Lenses",
    illumination_type="LED",
    excitation_wavelength_in_nm=405.0,
)
nwbfile.add_device(excitation_source_isos)

photodetector = Photodetector(
    name="Newport2151",
    description="Femtowatt photoreceiver",
    manufacturer="Newport",
    detector_type="photodiode",
    detected_wavelength_in_nm=525.0,
)
nwbfile.add_device(photodetector)

optical_fiber = OpticalFiber(
    name="Fiber_DMS",
    description="400um 0.48NA fiber optic cannula",
    manufacturer="Doric Lenses",
    numerical_aperture=0.48,
    core_diameter_in_um=400.0,
)
nwbfile.add_device(optical_fiber)

dichroic_mirror = DichroicMirror(
    name="DM_495",
    description="495nm dichroic mirror",
    manufacturer="Semrock",
    cut_on_wavelength_in_nm=495.0,
)
nwbfile.add_device(dichroic_mirror)

emission_filter = BandOpticalFilter(
    name="BP_500_550",
    description="500-550nm bandpass emission filter",
    manufacturer="Semrock",
    center_wavelength_in_nm=525.0,
    bandwidth_in_nm=50.0,
)
nwbfile.add_device(emission_filter)

# ── Step 2: Create Indicator ────────────────────────────────────────────

indicator = Indicator(
    name="dLight1.1",
    description="Genetically-encoded dopamine sensor",
    label="dLight1.1",
    injection_location="DMS",
    excitation_wavelength_in_nm=465.0,
    emission_wavelength_in_nm=525.0,
)

indicators = FiberPhotometryIndicators(
    name="fiber_photometry_indicators",
    indicators=[indicator],
)

# ── Step 3: Build FiberPhotometryTable ──────────────────────────────────

fp_table = FiberPhotometryTable(
    name="FiberPhotometryTable",
    description="Fiber photometry channel configuration",
)

# Signal channel (465nm excitation → dLight fluorescence)
fp_table.add_row(
    location="DMS",
    excitation_wavelength_in_nm=465.0,
    emission_wavelength_in_nm=525.0,
    indicator=indicator,
    optical_fiber=optical_fiber,
    excitation_source=excitation_source,
    photodetector=photodetector,
    dichroic_mirror=dichroic_mirror,
    emission_filter=emission_filter,
)

# Isosbestic control channel (405nm excitation → same fiber)
fp_table.add_row(
    location="DMS",
    excitation_wavelength_in_nm=405.0,
    emission_wavelength_in_nm=525.0,
    indicator=indicator,
    optical_fiber=optical_fiber,
    excitation_source=excitation_source_isos,
    photodetector=photodetector,
    dichroic_mirror=dichroic_mirror,
    emission_filter=emission_filter,
)

# ── Step 4: Create Response Series ──────────────────────────────────────

# Reference specific rows of the table
signal_region = fp_table.create_fiber_photometry_table_region(
    region=[0],
    description="Signal channel (465nm dLight)",
)

isos_region = fp_table.create_fiber_photometry_table_region(
    region=[1],
    description="Isosbestic control channel (405nm)",
)

signal_series = FiberPhotometryResponseSeries(
    name="dff_dms_signal",
    description="dF/F from dLight1.1 in DMS (465nm excitation)",
    data=dff_signal,               # shape: (n_timepoints,)
    rate=20.0,                     # sampling rate in Hz
    unit="F",
    fiber_photometry_table_region=signal_region,
)

isos_series = FiberPhotometryResponseSeries(
    name="dff_dms_isosbestic",
    description="Isosbestic control signal in DMS (405nm excitation)",
    data=dff_isos,
    rate=20.0,
    unit="F",
    fiber_photometry_table_region=isos_region,
)

nwbfile.add_acquisition(signal_series)
nwbfile.add_acquisition(isos_series)

# ── Step 5: Optional CommandedVoltageSeries ─────────────────────────────

commanded_voltage = CommandedVoltageSeries(
    name="commanded_voltage",
    description="Voltage commands to LEDs",
    data=voltage_data,
    rate=10000.0,
    unit="volts",
    frequency=211.0,              # modulation frequency in Hz
)
nwbfile.add_stimulus(commanded_voltage)

# ── Step 6: Wrap in FiberPhotometry LabMetaData ─────────────────────────

fiber_photometry = FiberPhotometry(
    name="fiber_photometry",
    fiber_photometry_table=fp_table,
    fiber_photometry_indicators=indicators,
)
nwbfile.add_lab_meta_data(fiber_photometry)
```

## Multi-Fiber Setup

For experiments with multiple fibers (e.g., DMS + NAc):

```python
fiber_dms = OpticalFiber(name="Fiber_DMS", ...)
fiber_nac = OpticalFiber(name="Fiber_NAc", ...)
nwbfile.add_device(fiber_dms)
nwbfile.add_device(fiber_nac)

# Add rows for each fiber × wavelength combination
fp_table.add_row(location="DMS", optical_fiber=fiber_dms,
                 excitation_wavelength_in_nm=465.0, ...)   # row 0
fp_table.add_row(location="DMS", optical_fiber=fiber_dms,
                 excitation_wavelength_in_nm=405.0, ...)   # row 1
fp_table.add_row(location="NAc", optical_fiber=fiber_nac,
                 excitation_wavelength_in_nm=465.0, ...)   # row 2
fp_table.add_row(location="NAc", optical_fiber=fiber_nac,
                 excitation_wavelength_in_nm=405.0, ...)   # row 3

# Create separate response series for each channel
dms_signal = FiberPhotometryResponseSeries(
    name="dff_dms",
    fiber_photometry_table_region=fp_table.create_fiber_photometry_table_region(
        region=[0], description="DMS signal channel"
    ),
    data=dms_data, rate=20.0, unit="F",
)
nac_signal = FiberPhotometryResponseSeries(
    name="dff_nac",
    fiber_photometry_table_region=fp_table.create_fiber_photometry_table_region(
        region=[2], description="NAc signal channel"
    ),
    data=nac_data, rate=20.0, unit="F",
)
```

## Common Indicators

| Indicator | Target | Excitation (nm) | Emission (nm) |
|-----------|--------|-----------------|---------------|
| dLight1.1 | Dopamine | 465 | 525 |
| dLight1.3b | Dopamine | 465 | 525 |
| GRAB-DA | Dopamine | 465 | 525 |
| GCaMP6f | Calcium | 488 | 525 |
| GCaMP7f | Calcium | 488 | 525 |
| rGECO1a | Calcium | 560 | 600 |
| GRAB-ACh | Acetylcholine | 465 | 525 |
| GRAB-5HT | Serotonin | 465 | 525 |
| iGluSnFR | Glutamate | 465 | 525 |

## Metadata YAML Template

```yaml
FiberPhotometry:
  FiberPhotometryTable:
    - location: DMS
      excitation_wavelength_in_nm: 465.0
      emission_wavelength_in_nm: 525.0
      coordinates: [0.5, 1.5, 3.0]    # AP, ML, DV in mm (optional)

  OpticalFibers:
    - name: Fiber_DMS
      description: 400um 0.48NA fiber optic cannula
      manufacturer: Doric Lenses
      numerical_aperture: 0.48
      core_diameter_in_um: 400.0

  ExcitationSources:
    - name: LED_465nm
      description: Blue LED
      manufacturer: Doric Lenses
      illumination_type: LED
      excitation_wavelength_in_nm: 465.0
    - name: LED_405nm
      description: Violet LED (isosbestic)
      manufacturer: Doric Lenses
      illumination_type: LED
      excitation_wavelength_in_nm: 405.0

  Photodetectors:
    - name: Newport2151
      description: Femtowatt photoreceiver
      manufacturer: Newport
      detector_type: photodiode
      detected_wavelength_in_nm: 525.0

  Indicators:
    - name: dLight1.1
      label: dLight1.1
      description: Genetically-encoded dopamine sensor
      injection_location: DMS
      excitation_wavelength_in_nm: 465.0
      emission_wavelength_in_nm: 525.0
```

## Notes

- **Always use this extension** for fiber photometry data. Do not store signals as
  plain TimeSeries in a processing module.
- The `FiberPhotometryTable` is a DynamicTable — each row represents one channel
  (one fiber × one excitation wavelength combination).
- Isosbestic control channels (typically 405nm) should be separate rows in the table
  with their own `FiberPhotometryResponseSeries`.
- The `FiberPhotometry` object is added as `lab_meta_data`, not in a processing module.
- `FiberPhotometryResponseSeries` can go in `acquisition` (raw) or `processing` (processed).
- `unit` for fluorescence data is typically `"F"` (arbitrary fluorescence units).
