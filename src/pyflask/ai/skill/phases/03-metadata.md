## Phase 3: Metadata Collection

**Goal**: Gather all metadata required for a complete, valid NWB file.

**Entry**: You know all data streams and their interfaces from Phase 2.

**Exit criteria**: You have complete metadata for:
- NWBFile-level fields (session_description, experiment_description, institution, lab, etc.)
- Subject fields (species, sex, age, genotype, subject_id)
- Device and electrode/imaging plane descriptions
- Session-specific fields (session_start_time with timezone, session_id)
- Trial/epoch structure if applicable

### Required NWB Metadata

**NWBFile (ask the user for these):**
- `session_description` — What happened in this session? (Required by NWB)
- `experiment_description` — Overall experiment description (can be paper abstract)
- `institution` — University/institute name
- `lab` — PI's lab name
- `experimenter` — List of experimenters as ["Last, First"]
- `keywords` — Relevant keywords for discoverability
- `related_publications` — DOI format: `"doi:10.xxxx/xxxxx"` (not URLs)

**Subject (ask the user for these):**
- `species` — Latin binomial (e.g., "Mus musculus", "Rattus norvegicus", "Homo sapiens") or NCBI taxonomy URI
- `sex` — One of: "M", "F", "U" (unknown), "O" (other). Single uppercase letter only.
- `age` — ISO 8601 duration: "P90D" (90 days), "P12W" (12 weeks), "P3M" (3 months). Can be a range: "P90D/P120D"
- `subject_id` — Unique identifier (required for DANDI)
- `genotype` — If transgenic
- `strain` — e.g., "C57BL/6J" (separate from species)
- `date_of_birth` — Preferred over `age` when available (datetime with timezone)
- `weight` — Format as "numeric unit": "0.025 kg" or "25 g" (not just a number)
- `description` — Any additional notes

### Modality-Specific Metadata

**For ophys (calcium imaging) experiments, also ask:**
- What brain region were you imaging? (e.g., "CA1", "V1", "mPFC")
- What calcium indicator did you use? (e.g., "GCaMP6f", "GCaMP7f", "jRGECO1a")
- What was the excitation wavelength? (e.g., 920 nm for GCaMP, 1040 nm for jRGECO)
- What objective did you use? (e.g., "Nikon 16x/0.8w")
- Single-plane or multi-plane imaging?

These map to NWB metadata:
```yaml
Ophys:
  Device:
    - name: Microscope
      description: Two-photon microscope
      manufacturer: Scanbox  # or Bruker, Thorlabs, etc.
  ImagingPlane:
    - name: ImagingPlane
      description: Imaging plane in hippocampal CA1
      excitation_lambda: 920.0
      indicator: GCaMP6f
      location: CA1
```

**For ecephys (extracellular electrophysiology), also ask:**
- What brain region(s) were you recording from? (Use Allen Brain Atlas terminology for mice, e.g., "CA1", "VISp", "MOs")
- What probe model? (e.g., Neuropixels 1.0, Neuropixels 2.0, Cambridge NeuroTech H2)
- How many probes per session?
- Do you have histology-confirmed electrode locations? (If so, these should override intended targets)

These are usually auto-extracted from SpikeGLX/OpenEphys metadata, but confirm with the user.
Note: every electrode MUST have a `location` value — use "unknown" if the region is truly unknown.

**Session-specific (often extracted from data):**
- `session_start_time` — MUST include timezone (e.g., America/New_York)
- `session_id` — Unique session identifier

### How to Ask

Don't dump a giant form. Instead, ask in context:

> Now I need to collect some metadata for the NWB files. Let me start with the basics:
>
> 1. What institution and lab is this from?
> 2. Who are the experimenters? (First and last names)
> 3. What species are the subjects? Are they a specific strain or transgenic line?

Then follow up:
> For the NWB files, I need a session description (what happened in a typical session)
> and an experiment description (the overall goal — this could be the abstract from
> your paper if you have one). Can you provide these?

### Metadata That Can Be Auto-Extracted

Many fields come from the data files themselves. Check what the interfaces provide:
```python
converter = MyNWBConverter(source_data=source_data)
metadata = converter.get_metadata()
print(json.dumps(metadata, indent=2, default=str))
```

Typically auto-extracted:
- `session_start_time` from SpikeGLX, OpenEphys, ScanImage headers
- `Device` info (probe model, serial number) from SpikeGLX meta files
- `ElectrodeGroup` and electrode positions from probe geometry
- Sampling rates, channel counts

### Where Metadata Goes

Metadata is stored in a `metadata.yaml` file alongside the conversion code:

```yaml
NWBFile:
  experiment_description: >
    We recorded neural activity in the medial entorhinal cortex
    while mice navigated a virtual reality track.
  institution: Stanford University
  lab: Giocomo Lab
  experimenter:
    - Wen, John
    - Giocomo, Lisa
  keywords:
    - virtual reality
    - entorhinal cortex
    - navigation
  related_publications:
    - https://doi.org/10.xxxx/xxxxx
Subject:
  species: Mus musculus
  strain: C57BL/6J
  sex: M
```

Session-specific metadata (subject_id, session_start_time) is set programmatically
in `convert_session.py` since it varies per session.

### Push Phase 3 Results

After collecting metadata, commit and push the metadata files:
```bash
git add conversion_notes.md metadata.yaml subject_metadata.yaml 2>/dev/null
git commit -m "Phase 3: metadata collection — NWBFile, Subject, and device metadata"
if git remote get-url origin &>/dev/null; then git push; fi
```

### Per-Subject Metadata

You MUST collect subject-level metadata for each subject. This is required for DANDI upload.

For each subject, collect:
- `subject_id` — **Required**. Unique identifier.
- `species` — **Required**. Latin binomial (e.g., "Mus musculus", "Rattus norvegicus").
- `sex` — **Recommended**. One of "M", "F", "U", "O".
- `date_of_birth` — **Recommended**. Or `age` per session as ISO 8601 duration (e.g., "P90D").
- `genotype` — **Recommended** if transgenic.
- `weight` — **Recommended**. At time of experiment or implant.
- `strain` — **Recommended** (e.g., "C57BL/6J").

If there are multiple subjects, create a `subject_metadata.yaml` (or `.json`) keyed by
subject_id:

```yaml
N2:
  species: Mus musculus
  strain: C57BL/6J
  sex: M
  date_of_birth: 2019-10-22
  weight: "0.025 kg"
R5:
  species: Mus musculus
  genotype: CaMKII-cre hemizygous
  sex: F
  date_of_birth: 2019-06-15
  weight: "0.022 kg"
```

Ask the user if they have a spreadsheet or JSON file with this information. If they have
analysis code, it often contains subject metadata as a lookup table or config file.

### Timezone Handling

Session start times MUST have timezone information. Ask the user:
> What timezone was the data collected in?

Common US timezones:
- `America/New_York` (Eastern)
- `America/Chicago` (Central)
- `America/Denver` (Mountain)
- `America/Los_Angeles` (Pacific)

Use `zoneinfo.ZoneInfo` in the conversion code:
```python
from zoneinfo import ZoneInfo
tz = ZoneInfo("America/Los_Angeles")
metadata["NWBFile"]["session_start_time"] = session_start_time.replace(tzinfo=tz)
```
