## Phase 1: Experiment Discovery

**Goal**: Build a complete picture of the lab's experiments, data modalities, and file organization.

**Entry**: User invokes `/nwb-convert`, possibly with a path to their data.

**Exit criteria**: You have a clear `experiment_spec` (written to `conversion_notes.md`) covering:
- What experiments were performed
- All data streams (raw and processed) for each experiment
- File formats for each stream
- How data is organized on disk (directory structure)
- Number of subjects and sessions
- Any special considerations (multiple probes, multiple FOVs, etc.)

### Step 0a: Check Environment

**Skip this step if running inside NWB GUIDE** (all packages are pre-installed).

Before anything else, verify the required Python packages are installed. The skill
needs `neuroconv`, `pynwb`, `dandi`, and several inspection libraries.

```bash
python3 -c "
missing = []
for pkg, module in [
    ('neuroconv', 'neuroconv'),
    ('pynwb', 'pynwb'),
    ('dandi', 'dandi'),
    ('nwbinspector', 'nwbinspector'),
    ('spikeinterface', 'spikeinterface'),
    ('h5py', 'h5py'),
    ('remfile', 'remfile'),
    ('pandas', 'pandas'),
    ('pyyaml', 'yaml'),
]:
    try:
        __import__(module)
    except ImportError:
        missing.append(pkg)
if missing:
    print('MISSING: ' + ' '.join(missing))
else:
    print('OK')
"
```

If packages are missing, install them:
```bash
pip install neuroconv pynwb dandi nwbinspector spikeinterface h5py remfile pandas pyyaml
```

The full environment specification is in `skills/nwb-convert/make_env.yml`. If the user
prefers conda, they can create the environment with:
```bash
conda env create -f <skill_path>/make_env.yml
conda activate nwb-convert
```

### Step 0b: Create Conversion Repo and Consult Registry

Before the first user-facing question, set up the conversion repo and check for prior work.

**Create the repo.** The skill calls the nwb-conversions API to create a private repo
in the `nwb-conversions` GitHub org. The user does NOT need a GitHub account — the API
handles authentication server-side.

```bash
# API base URL (Cloudflare Worker)
NWB_API="https://nwb-conversions-api.ben-dichter.workers.dev"

# Derive lab name from user context (ask if unclear)
LAB_NAME="<lab-name>"
REPO_NAME="${LAB_NAME}-to-nwb"

# Create repo via API
RESPONSE=$(curl -sf -X POST "${NWB_API}/repos" \
  -H "Content-Type: application/json" \
  -d "{\"lab_name\": \"${LAB_NAME}\"}")

if [ $? -eq 0 ]; then
    PUSH_URL=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['push_url'])")
    mkdir "${REPO_NAME}" && cd "${REPO_NAME}"
    git init
    git remote add origin "${PUSH_URL}"
    git config user.name "nwb-conversions-bot"
    git config user.email "nwb-conversions-bot@users.noreply.github.com"
else
    # API unreachable — work locally only
    mkdir "${REPO_NAME}" && cd "${REPO_NAME}"
    git init
fi
```

If the API is unreachable, inform the user:
> I'll create a local conversion repo to organize the code. The conversion registry
> is not available right now, but this won't affect the conversion itself.

All subsequent file creation should happen INSIDE this directory. When a remote is
configured, the skill pushes after every phase.

**Seed the repo** with a `.gitignore` and initial commit:
```bash
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*.egg-info/
dist/
build/
*.egg

# NWB output (don't commit data files)
*.nwb
nwb_output/
nwb_stub/

# Environment
.env
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
EOF

git add .gitignore
git commit -m "Initial commit: add .gitignore"
if git remote get-url origin &>/dev/null; then git push; fi
```

**Fetch the conversion registry** to find similar prior conversions:
```bash
curl -sf "${NWB_API}/registry" > /tmp/registry.yaml || true
```

If the API is unreachable or the registry is empty, skip registry consultation and
proceed directly to the opening questions.

**Search the registry** for relevant prior work. Look for matches on:
- Same species
- Same modalities (ecephys, ophys, behavior, icephys)
- Same file formats or interfaces
- Same recording systems (SpikeGLX, OpenEphys, Suite2p, etc.)

```python
import yaml
from pathlib import Path

registry_path = Path("/tmp/registry.yaml")
if registry_path.exists() and registry_path.stat().st_size > 0:
    with open(registry_path) as f:
        registry = yaml.safe_load(f)

    # Find conversions with matching modalities
    target_modalities = {"ecephys", "behavior"}  # from user description
    for conv in registry.get("conversions", []):
        overlap = target_modalities & set(conv.get("modalities", []))
        if overlap:
            print(f"Similar: {conv['id']} ({conv['repo']})")
            print(f"  Modalities: {conv['modalities']}")
            print(f"  Interfaces: {conv['interfaces']}")
            if conv.get("lessons"):
                print(f"  Lessons: {conv['lessons']}")
```

If you find relevant prior conversions, mention them to the user:
> I found N similar conversions in our registry that used the same recording system /
> modalities. I'll use those as references as we build yours.

If the registry is empty or has no matches, proceed normally — this is expected for early conversions.

### Opening Questions

Start with broad, open-ended questions. Don't ask all at once — ask 2-3, then follow up.

**First message should be something like:**
> I'd like to help you convert your data to NWB and publish it on DANDI. Let's start by
> understanding your experiment.
>
> 1. Can you briefly describe your experiment? What were you studying?
> 2. What types of neural recordings did you collect? (e.g., extracellular electrophysiology,
>    calcium imaging, intracellular recordings, etc.)
> 3. Did you also record behavioral data? (e.g., position tracking, video, licking, running speed)

**If the user provided a data path**, inspect the directory structure FIRST:
```
ls -la <path>
find <path> -maxdepth 3 -type f | head -50
```
Then ask targeted questions based on what you see.

### Follow-up Questions (ask as needed)

**About recordings:**
- What recording system did you use? (e.g., SpikeGLX, OpenEphys, Intan, Blackrock, Neuralynx, Axona)
- How many probes/electrodes per session?
- Did you do spike sorting? What software? (Kilosort, Phy, CellExplorer, MountainSort)
- Is there LFP data separate from the raw recording?

**About imaging:**
- What microscope/acquisition software? (ScanImage, Scanbox, Bruker, Inscopix, Miniscope)
- One-photon or two-photon?
- Did you run segmentation? What software? (Suite2p, CaImAn, CNMFE, EXTRACT)
- Single plane or multi-plane?

**About behavior:**
- Is there pose estimation? (DeepLabCut, SLEAP, LightningPose)
- Video recordings? How many cameras?
- Trial structure? What defines a trial?
- Stimulus presentation? What software? (PsychoPy, Bpod, Arduino)
- Task events? (licks, rewards, tone presentations, etc.)

**About organization:**
- How are files organized? One folder per session? Per subject?
- Is there a naming convention?
- Are there processed/analyzed files in addition to raw data?
- Approximately how many sessions total?

**About existing resources (always ask these):**
- Is there a manuscript, preprint, or published paper describing this data?
  (If yes, get the DOI or URL — this helps with experiment_description and related_publications)
- Is this data already publicly available in any non-NWB format? (e.g., on Figshare, Zenodo,
  institutional repository, or another archive)
- Do you have existing analysis code for this data? (e.g., MATLAB scripts, Python notebooks)
  These often reveal data structure, variable names, and processing steps that inform the conversion.
- Do you have any code that reads or converts this data to another format?
  (Existing readers save significant reverse-engineering effort)

### Fetching Publication Details

When the user provides a DOI, PMID, PMC ID, or publication URL, use the paper fetcher tool
to retrieve the full text (or abstract). This is extremely valuable for understanding the
experiment, data modalities, recording parameters, and subject details.

```bash
python3 tools/fetch_paper.py "<identifier>" --extract methods
```

The tool accepts DOIs (e.g., `10.1038/s41586-019-1234-5`), PMIDs (e.g., `31234567`),
PMC IDs (e.g., `PMC6789012`), or URLs from doi.org, PubMed, or PMC.

**What to extract from the paper:**
1. **Methods section** (`--extract methods`): Recording systems, file formats, number of
   subjects/sessions, experimental protocols, data acquisition parameters
2. **Abstract** (`--extract abstract`): High-level experiment description for `experiment_description`
3. **Full text** (no `--extract` flag): When you need comprehensive details

**How to use the information:**
- Pre-fill the experiment description from the abstract
- Identify data modalities and recording systems from methods
- Extract subject counts, species, and session details
- Find stimulus/behavioral task descriptions
- Get the DOI for `related_publications` (format: `"doi:10.xxxx/xxxxx"`)
- Look for mentions of data availability statements that may link to existing public data

After fetching, confirm key details with the user — papers may describe a larger study
than what the user is converting, or parameters may have changed.

**About subjects (collect early to plan per-subject metadata):**
- How many subjects are in this dataset?
- Do you have a spreadsheet or file with subject information?
- For each subject, we'll need: subject_id, date of birth (or age at each session),
  species (Latin binomial, e.g., "Mus musculus"), sex, genotype, and ideally weight.
- Are there different experimental groups (e.g., different genotypes, treatment vs. control)?

### What to Record

After this phase, update `conversion_notes.md` with:

```markdown
# Conversion Notes

## Experiment Overview
[Brief description of the experiment]

## Data Streams
| Stream | Format | Recording System | File Pattern | NeuroConv Interface? |
|--------|--------|-----------------|--------------|---------------------|
| Raw ephys | SpikeGLX .bin | Neuropixel | *_g0_t0.imec0.ap.bin | SpikeGLXRecordingInterface |
| LFP | SpikeGLX .bin | Neuropixel | *_g0_t0.imec0.lf.bin | SpikeGLXLFPInterface |
| Spike sorting | Phy | Kilosort+Phy | phy/ folder | PhySortingInterface |
| Behavior | .txt files | Custom | *position.txt, *licks.txt | Custom needed |

## Directory Structure
[Description or tree output]

## Sessions
- Number of subjects: X
- Number of sessions: ~Y
- Session naming convention: ...

## Existing Resources
- Publication: [DOI or "not yet published"]
- Existing public data: [URL or "none"]
- Analysis code: [URL or path or "none"]
- Existing data readers: [description or "none"]

## Subjects
| subject_id | species | sex | date_of_birth | genotype | weight | group |
|------------|---------|-----|---------------|----------|--------|-------|
| ... | Mus musculus | M | 2019-10-22 | C57BL/6J | 25 g | control |

## Open Questions
- [ ] ...
```

### Push Phase 1 Results

After writing `conversion_notes.md`, commit and push:
```bash
git add conversion_notes.md
git commit -m "Phase 1: experiment discovery — data streams and directory structure"
if git remote get-url origin &>/dev/null; then git push; fi
```
