# NWB Best Practices

Distilled from the [official NWB Inspector best practices](https://github.com/NeurodataWithoutBorders/nwbinspector/tree/dev/docs/best_practices).
These are conventions and common-mistake guards that the NWB Inspector checks for.
The conversion agent should follow these when generating code.

## General

- **CamelCase for neurodata_type names** (e.g., `ElectricalSeries`, `SpatialSeries`).
- **snake_case for object names** (groups, datasets, attributes). No spaces — use underscores.
- **No slashes or colons in names** — these are path separators in HDF5.
- **No empty strings** — every `description`, `unit`, and text field must have meaningful content. Empty strings and placeholder text like "no description" will be flagged.
- **Avoid metadata duplication** — don't store the same metadata in multiple places. For example, don't add `unit` or `gain` columns to the electrodes table when those belong on `ElectricalSeries`.

## NWBFile Metadata

- **File extension**: always `.nwb`.
- **`identifier`**: must be globally unique. Use `str(uuid.uuid4())`.
- **`session_start_time`**: must include timezone info. All other timestamps are relative to this.
- **`timestamps_reference_time`**: defaults to `session_start_time`. Only set explicitly if different.
- **`session_id`**: should be unique across sessions in a dataset. Use a descriptive string, not just a number.
- **`session_description`**: required. Describe what happened in this session.
- **`experiment_description`**: describe the scientific goal. Can use the paper abstract.
- **`experimenter`**: list of strings in "Last, First" format.
- **`institution`**: name of the institution.
- **`keywords`**: list of relevant keywords for discoverability.
- **`related_publications`**: use DOI format: `"doi:10.xxxx/xxxxx"`.
- **Acquisition vs. processing**: raw data goes in `nwbfile.acquisition`. Processed/derived data goes in `nwbfile.processing["module_name"]`.
- **Processing module names**: use standard names: `"ecephys"`, `"ophys"`, `"behavior"`, `"misc"`. Custom names are allowed but standard names enable tool interoperability.

## Subject

- **Subject must exist**: every NWB file should have a `Subject` object.
- **`subject_id`**: required for DANDI. Unique identifier for the animal.
- **`sex`**: one of `"M"`, `"F"`, `"U"` (unknown), `"O"` (other). Single uppercase letter.
- **`species`**: Latin binomial (e.g., `"Mus musculus"`) or NCBI taxonomy URI (e.g., `"http://purl.obolibrary.org/obo/NCBITaxon_10090"`). Never use common names like "mouse".
- **`strain`**: the specific strain (e.g., `"C57BL/6J"`). Separate from species.
- **`age`**: ISO 8601 duration format: `"P90D"` (90 days), `"P12W"` (12 weeks), `"P3M"` (3 months). A reference age can be expressed as a range: `"P90D/P120D"`.
- **`date_of_birth`**: preferred over `age` when available (datetime with timezone).
- **`weight`**: format as `"numeric unit"`, e.g., `"0.025 kg"` or `"25 g"`.

## Time Series

- **Time-first data orientation**: the first dimension of `data` must be time. If your array is `(channels, timepoints)`, transpose it to `(timepoints, channels)`.
- **SI units**: `unit` should be SI where possible (meters, seconds, volts, amperes). Use `conversion` parameter instead of transforming data.
- **Timestamps must be in seconds**: all timestamps are in seconds relative to `session_start_time`.
- **Timestamps must be ascending**: timestamps array must be sorted in ascending order.
- **No NaN in timestamps**: timestamps must never contain NaN values.
- **Use `rate` + `starting_time` for regular sampling**: if data has a constant sampling rate, set `rate` (Hz) and `starting_time` (seconds) instead of providing a `timestamps` array. This saves space and is more precise.
- **Avoid negative timestamps**: all timestamps should be >= 0. Negative timestamps imply data before `session_start_time`, which is usually an error.
- **Use chunking and compression**: for large datasets, use `H5DataIO` with `compression="gzip"` and appropriate chunk sizes.
- **`resolution`**: set to `-1.0` if unknown. Otherwise, provide the smallest meaningful difference between data values.
- **Rate must be positive and nonzero**: if using `rate`, it must be > 0.
- **Use appropriate TimeSeries subtypes**: don't use bare `TimeSeries` when a more specific type exists (e.g., `ElectricalSeries` for ephys, `SpatialSeries` for position).
- **Breaks in continuity**: if there are gaps in recording, either use separate `TimeSeries` objects or provide explicit `timestamps` (not `rate`) to capture the gaps.

## Tables (DynamicTable)

- **No JSON strings in columns**: if a column value is structured data, use a proper column type (VectorData, DynamicTableRegion, etc.), not a JSON-encoded string.
- **No empty tables**: don't create DynamicTable objects with zero rows.
- **Boolean columns**: name boolean columns with `is_` prefix (e.g., `is_correct`, `is_rewarded`).
- **Timing columns**: name columns containing times with `_time` suffix (e.g., `start_time`, `stop_time`). Use `_times` for ragged arrays of times.
- **Unique IDs**: the `id` column of any DynamicTable should contain unique values. Don't override with non-unique values — use a custom column instead.
- **Avoid single-row tables**: if a table has only one row, consider if there's a more appropriate container.

## Extracellular Electrophysiology (ecephys)

- **Electrode `location` is required**: fill with your best estimate of the brain region. Use `"unknown"` if truly unknown.
- **Use Allen Brain Atlas ontology**: for mice, use Allen Brain Atlas terms (full name or abbreviation). Don't invent terms.
- **Anatomical coordinates (`x`, `y`, `z`)**: for precise brain coordinates. For mice, use Allen Institute Common Coordinate Framework v3 (+x = posterior, +y = inferior, +z = right).
- **Relative coordinates (`rel_x`, `rel_y`, `rel_z`)**: for electrode position on the probe. Used by spike sorters to determine proximity.
- **Don't duplicate metadata in electrodes table**: don't add `unit`, `gain`, `offset` columns — those belong on `ElectricalSeries` (`channel_conversion`, `offset`).
- **Spike times must be ascending**: within each unit, spike times must be in ascending order.
- **Spike times must be positive**: all spike times >= 0. Negative times suggest trial-alignment that should be corrected to session-alignment.
- **Use `obs_intervals`**: if the recording has gaps where a unit was not observable, set `obs_intervals` on the units table. No spikes should exist outside observed intervals.

## Optical Physiology (ophys)

- **`image_mask` shape consistency**: the `image_mask` column of `PlaneSegmentation` must have the same shape as `reference_images`.
- **ImagingPlane required fields**: always set `excitation_lambda`, `indicator`, and `location` on `ImagingPlane`.
- **TwoPhotonSeries rate**: must be nonzero. Get from Suite2p `ops["fs"]` or calculate from timestamps.
- **Store raw imaging data internally**: use chunking + lossless compression (not external file mode).

## Behavior

- **SpatialSeries dimensionality**: must have 1 (x), 2 (x,y), or 3 (x,y,z) columns. Not more.
- **SpatialSeries is only for position**: velocity, acceleration, and other derived signals should use `TimeSeries` or `BehavioralTimeSeries`, not `SpatialSeries`.
- **CompassDirection units**: must be `"degrees"` or `"radians"`.
- **CompassDirection data range**: degrees must be in [-360, 360]; radians in [-2pi, 2pi].

## Image Series

- **External mode for animal videos**: behavioral videos (webcam, etc.) should use `external_file` to reference the video file alongside the NWB file. This allows video-optimized lossy codecs.
- **Internal storage for neural imaging**: TwoPhotonSeries and similar neural data should be stored inside the NWB file with lossless compression.
- **Relative paths for external files**: `external_file` paths should be relative to the NWB file location.
- **`starting_frame`**: only set when using `external_file`. Not applicable for internally stored data.

## Optogenetics

- **Every `OptogeneticStimulusSite` must have an `OptogeneticSeries`**: don't create stimulus sites without corresponding stimulus data.

## Extensions

- **Use sparingly**: prefer core NWB types and DynamicTable columns before creating extensions.
- **Check for existing extensions** in the NDX Catalog before creating new ones.
- **Use `ndx-template`** to scaffold new extensions.
- **Cache the spec**: always write the extension specification into the NWB file (`cache_spec=True`).
- **Flag for human expert**: the conversion skill should flag when an extension might be needed rather than creating one automatically.
