## Phase 7: DANDI Upload

**Goal**: Upload validated NWB files to the DANDI Archive for public sharing.

**Entry**: All NWB files are converted, validated with nwbinspector, and ready for sharing.

**Exit criteria**: Data is uploaded to DANDI, organized correctly, and accessible via the Dandiset URL.

### Step 0: Choose DANDI Instance

**Always ask this first.** Before any upload steps, ask the user which DANDI instance to use:

> We're ready to upload your NWB files to DANDI! First, which DANDI instance would you
> like to use?
>
> 1. **DANDI Sandbox** (gui-staging.dandiarchive.org) — for testing. Data can be deleted.
>    Use this if you want to verify everything works before publishing for real.
> 2. **DANDI Archive** (dandiarchive.org) — the official public archive. Use this when
>    you're ready to publish your data permanently.
>
> Which would you prefer?

Set the instance URL based on their choice:
- **Sandbox**: `DANDI_INSTANCE_URL=https://gui-staging.dandiarchive.org`
  and `DANDI_API_URL=https://api-staging.dandiarchive.org/api`
- **Archive**: use the defaults (no env vars needed)

For sandbox uploads, add `-i dandi-staging` to all `dandi` CLI commands.

### Prerequisites

Before uploading, the user needs:
1. A DANDI account (on the chosen instance — sandbox and archive have separate accounts)
2. A DANDI API key (from user profile on the chosen instance)
3. A Dandiset created on the chosen instance (or you help them create one)
4. The `dandi` CLI installed (`pip install -U dandi`)

### Step 1: Create a Dandiset

Guide the user through creating a Dandiset on the DANDI Archive:

> Before we upload, we need to create a Dandiset on DANDI Archive. Have you already
> created one? If not, here's how:
>
> 1. Go to https://dandiarchive.org and log in (or create an account)
> 2. Click "New Dandiset" in the top right
> 3. Fill in the metadata:
>    - **Name**: A descriptive title for your dataset
>    - **Description**: Abstract or summary of the dataset
>    - **License**: Usually CC-BY-4.0 for open data
>    - **Contributors**: Add all contributors with their ORCID IDs
> 4. Note the 6-digit Dandiset ID (e.g., "000123")

If the data should be embargoed (not publicly visible yet):
> If your data needs to be embargoed (e.g., pending publication), select the
> embargo option when creating the Dandiset. Embargoed data is only visible
> to Dandiset owners until you release it.

### Step 2: Set Up API Key

```bash
# Get your API key from https://dandiarchive.org (click your initials → API Key)
export DANDI_API_KEY=<your-key-here>
```

> You'll need your DANDI API key. Go to https://dandiarchive.org, click your
> initials in the top right, and copy your API key. Then set it as an environment
> variable:
> ```bash
> export DANDI_API_KEY=your_key_here
> ```

### Step 3: Validate Before Upload

Run `dandi validate` on the NWB files before uploading:

```bash
dandi validate /path/to/nwb/output/
```

This checks for DANDI-specific requirements beyond what nwbinspector catches:
- File naming conventions
- Required metadata fields (subject_id, session_id)
- NWB file structure compliance

Fix any validation errors before proceeding.

### Step 4: Upload Using NeuroConv Helper (Recommended)

NeuroConv provides `automatic_dandi_upload()` which handles download, organize, and upload:

```python
from neuroconv.tools.data_transfers import automatic_dandi_upload

automatic_dandi_upload(
    dandiset_id="000123",           # 6-digit Dandiset ID
    nwb_folder_path="./nwb_output", # Folder with all NWB files
    sandbox=False,                   # True for testing on sandbox server
    number_of_jobs=1,               # Parallel upload jobs
    number_of_threads=4,            # Threads per upload
)
```

This function:
1. Downloads the Dandiset metadata (creates the local Dandiset structure)
2. Runs `dandi organize` to rename files to DANDI conventions (sub-<id>/sub-<id>_ses-<id>.nwb)
3. Uploads all organized NWB files

### Step 5: Upload Using DANDI CLI (Alternative)

If the NeuroConv helper doesn't work, use the DANDI CLI directly:

```bash
# 1. Download the Dandiset structure
dandi download https://dandiarchive.org/dandiset/000123/draft
cd 000123

# 2. Organize NWB files into DANDI structure (renames files)
dandi organize /path/to/nwb/output/ -f dry  # Preview first
dandi organize /path/to/nwb/output/         # Execute

# 3. Validate
dandi validate .

# 4. Upload
dandi upload
```

### Step 5b: Upload Using DANDI Python API (Alternative)

If the CLI approaches have issues (e.g., sandbox identifier format), use the Python API directly:

```python
from pathlib import Path
from dandi.dandiapi import DandiAPIClient

client = DandiAPIClient.from_environ()  # or DandiAPIClient(api_url="https://api.sandbox.dandiarchive.org/api")
client.dandi_authenticate()
dandiset = client.get_dandiset("000123", "draft")

# Upload each organized NWB file
# NOTE: iter_upload_raw_asset() is on the RemoteDandiset object, NOT on DandiAPIClient
nwb_dir = Path("./000123")
for nwb_path in sorted(nwb_dir.rglob("*.nwb")):
    asset_path = str(nwb_path.relative_to(nwb_dir))
    print(f"Uploading {asset_path}...")
    for status in dandiset.iter_upload_raw_asset(nwb_path, asset_metadata={"path": asset_path}):
        if isinstance(status, dict) and status.get("status") == "done":
            print(f"  Done: {status['asset'].path}")
```

**DANDI sandbox URL**: Always use `https://api.sandbox.dandiarchive.org/api` for the
sandbox. The older `api-staging.dandiarchive.org` URL redirects and strips auth headers,
causing 401 errors on write operations.

### Step 6: Verify on DANDI

After upload completes:
> Your data is now on DANDI! You can view it at:
> https://dandiarchive.org/dandiset/000123/draft
>
> Please verify:
> 1. All sessions appear in the file listing
> 2. The metadata looks correct
> 3. You can stream and preview the NWB files in Neurosift
>
> When you're ready to publish (make it permanently citable with a DOI),
> click "Publish" on the Dandiset page. This creates an immutable version.

### Step 7: Edit Dandiset Metadata

After uploading, programmatically populate the Dandiset metadata using the DANDI API.
If there is an associated manuscript, use OpenAlex to auto-populate contributors, funders,
and affiliations.

> Now let's complete your Dandiset metadata so it's ready for publication.
> Is there an associated publication or preprint? If so, please share the DOI
> (e.g., `10.1038/s41586-023-06031-6`).

#### 7a. Fetch Structured Data from OpenAlex

If the user provides a DOI, query OpenAlex to get authors, ORCIDs, affiliations, ROR IDs,
and funding info:

```python
import requests

doi = "10.1038/s41467-023-43250-x"  # user-provided
response = requests.get(f"https://api.openalex.org/works/doi:{doi}")
work = response.json()

# Title
title = work["title"]

# Authors with ORCIDs, affiliations, and ROR IDs
for authorship in work["authorships"]:
    author = authorship["author"]
    name = author["display_name"]           # e.g., "Steffen Schneider"
    orcid = author.get("orcid")             # e.g., "https://orcid.org/0000-0003-2327-6459"
    is_corresponding = authorship["is_corresponding"]
    for inst in authorship.get("institutions", []):
        inst_name = inst["display_name"]    # e.g., "Columbia University"
        inst_ror = inst.get("ror")          # e.g., "https://ror.org/00hj8s172"

# Funders with ROR IDs and award numbers
# NOTE: OpenAlex grants are often empty — check the paper's acknowledgments section
# and ask the user to confirm funding information
for grant in work.get("grants", []):
    funder_name = grant["funder_display_name"]  # e.g., "National Institute of Mental Health"
    funder_ror = grant.get("funder", {}).get("ror")  # e.g., "https://ror.org/04xeg9z08"
    award_id = grant.get("funder_award_id")     # e.g., "R21MH117788"
```

**OpenAlex data quality warnings:**
- Some authors have **null ORCIDs** — only add `identifier` to the DANDI contributor
  when an ORCID actually exists. Do not set it to `null` or empty string.
- The `grants` array is **often empty** even for well-funded papers — always cross-reference
  the paper's acknowledgments section and ask the user.
- OpenAlex may list **extra institutional affiliations** (historical or secondary) that
  don't match the paper. Include all but flag them for the user to review.

Present the extracted data to the user for confirmation:

> I found the following from OpenAlex for your paper "{title}":
>
> **Authors:**
> 1. Last, First (ORCID: 0000-...) — Institution (ROR: ...)
> 2. ...
>
> **Funding:**
> 1. Agency Name — Award: XYZ123 (ROR: ...)
>
> Does this look correct? Should I add or remove anyone? Who should be the contact person?

#### 7b. Validate Identifiers

Before applying any metadata, validate all ORCID and ROR identifiers against their
respective APIs to prevent bad data from being committed:

```python
def validate_orcid(orcid: str) -> bool:
    """Validate ORCID exists. orcid should be bare ID like '0000-0001-2345-6789'."""
    resp = requests.head(
        f"https://pub.orcid.org/v3.0/{orcid}",
        headers={"Accept": "application/json"},
    )
    return resp.status_code == 200

def validate_ror(ror_url: str) -> bool:
    """Validate ROR ID exists. ror_url like 'https://ror.org/01cwqze88'.

    NOTE: ROR API v2 changed the response schema — org name is in
    org["names"][0]["value"], not org["name"]. Some OpenAlex ROR IDs
    may be stale (return 404) due to organization mergers.
    """
    ror_id = ror_url.replace("https://ror.org/", "")
    resp = requests.get(f"https://api.ror.org/v2/organizations/{ror_id}")
    return resp.status_code == 200
```

Run validation on all extracted identifiers and warn the user about any that fail:

```python
for authorship in work["authorships"]:
    orcid = authorship["author"].get("orcid", "").replace("https://orcid.org/", "")
    if orcid and not validate_orcid(orcid):
        print(f"WARNING: ORCID {orcid} for {authorship['author']['display_name']} not found")

    for inst in authorship.get("institutions", []):
        ror = inst.get("ror")
        if ror and not validate_ror(ror):
            print(f"WARNING: ROR {ror} for {inst['display_name']} not found")
```

#### 7c. Look Up Ontology Terms for the `about` Field

Use the EBI Ontology Lookup Service (OLS4) to find proper ontology identifiers for brain
regions, disorders, and cell types. Never guess or fabricate ontology identifiers.

```python
def lookup_ontology_term(term: str, ontology: str = "uberon") -> list[dict]:
    """Search EBI OLS4 for an ontology term.

    ontology: 'uberon' (anatomy), 'doid' (disease), 'cl' (cell type)
    """
    resp = requests.get(
        "https://www.ebi.ac.uk/ols4/api/search",
        params={"q": term, "ontology": ontology, "rows": "5", "queryFields": "label,synonym"},
    )
    results = resp.json().get("response", {}).get("docs", [])
    return [{"label": r["label"], "iri": r["iri"], "obo_id": r.get("obo_id")} for r in results]

# Example: look up "hippocampus"
terms = lookup_ontology_term("hippocampus", "uberon")
# → [{"label": "hippocampal formation", "iri": "http://purl.obolibrary.org/obo/UBERON_0002421",
#      "obo_id": "UBERON:0002421"}, ...]
```

**OLS4 search pitfalls — always use exact label matching:**

OLS4 often returns sub-regions or synonyms instead of the term you want:
- Searching "primary motor cortex" may return "primary motor cortex layer 6" as the top result
- Searching "secondary motor cortex" may return "premotor cortex" (a synonym with the same UBERON ID)
- Searching "dorsomedial striatum" returns unrelated terms — search for "dorsal striatum" instead

**Always iterate through results and match by exact label** (case-insensitive) before
falling back to the first result:

```python
def lookup_ontology_term_exact(term, ontology="uberon"):
    """Search OLS4 with exact label matching."""
    results = lookup_ontology_term(term, ontology)
    # Prefer exact label match
    for r in results:
        if r["label"].lower() == term.lower():
            return r
    # Fall back to first result if no exact match
    return results[0] if results else None
```

**Maintain a fallback table** for commonly used terms where OLS4 search is unreliable:

```python
UBERON_FALLBACKS = {
    "primary visual cortex": {"label": "primary visual cortex", "obo_id": "UBERON:0002436",
        "iri": "http://purl.obolibrary.org/obo/UBERON_0002436"},
    "secondary visual cortex": {"label": "secondary visual cortex", "obo_id": "UBERON:0022232",
        "iri": "http://purl.obolibrary.org/obo/UBERON_0022232"},
    "primary motor cortex": {"label": "primary motor cortex", "obo_id": "UBERON:0001384",
        "iri": "http://purl.obolibrary.org/obo/UBERON_0001384"},
    "secondary motor cortex": {"label": "secondary motor cortex", "obo_id": "UBERON:0016634",
        "iri": "http://purl.obolibrary.org/obo/UBERON_0016634"},
    "primary somatosensory cortex": {"label": "primary somatosensory cortex", "obo_id": "UBERON:0008933",
        "iri": "http://purl.obolibrary.org/obo/UBERON_0008933"},
    "dorsal striatum": {"label": "dorsal striatum", "obo_id": "UBERON:0005382",
        "iri": "http://purl.obolibrary.org/obo/UBERON_0005382"},
    "nucleus accumbens": {"label": "nucleus accumbens", "obo_id": "UBERON:0001882",
        "iri": "http://purl.obolibrary.org/obo/UBERON_0001882"},
}
```

Present results to the user and add confirmed terms to `about`:
```python
metadata["about"] = [
    {
        "schemaKey": "Anatomy",
        "name": "hippocampal formation",
        "identifier": "UBERON:0002421",
    },
]
```

Supported ontology → `schemaKey` mapping:
| Ontology | `schemaKey` | Use for |
|----------|-------------|---------|
| UBERON | `Anatomy` | Brain regions, anatomical structures |
| DOID | `Disorder` | Diseases, disorders |
| CL | `Anatomy` | Cell types |
| HP | `Disorder` | Human phenotypes |

#### 7d. Build the Metadata and Set via DANDI API

Use the `dandi` Python client to programmatically update the Dandiset metadata.

**IMPORTANT**: Never call `set_raw_metadata()` directly — it accepts invalid metadata silently.
Always use this `validate_and_save` wrapper that validates against the DANDI JSON schema first:

```python
import requests, jsonschema
from dandi.dandiapi import DandiAPIClient

_schema_cache = {}

def validate_and_save(dandiset, metadata):
    """Validate metadata against the canonical DANDI JSON schema, then save.

    Raises ValueError if metadata is invalid. Uses the official schema from
    https://github.com/dandi/schema (not dandischema.models.model_json_schema(),
    which has Pydantic v2 generation bugs with anyOf/type conflicts).
    """
    version = metadata.get("schemaVersion", "0.7.0")
    if version not in _schema_cache:
        url = f"https://raw.githubusercontent.com/dandi/schema/refs/heads/master/releases/{version}/dandiset.json"
        _schema_cache[version] = requests.get(url).json()
    schema = _schema_cache[version]

    validator = jsonschema.Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(metadata), key=lambda e: list(e.absolute_path))
    if errors:
        print(f"Schema validation FAILED ({len(errors)} errors):")
        for err in errors:
            path = ".".join(str(p) for p in err.absolute_path)
            print(f"  {path}: {err.message}")
        raise ValueError("Fix validation errors before saving")

    dandiset.set_raw_metadata(metadata)
    print("Metadata validated and saved!")

client = DandiAPIClient.from_environ()  # uses DANDI_API_KEY env var
dandiset = client.get_dandiset("000123", "draft")
metadata = dandiset.get_raw_metadata()
```

**Schema validation approach**: Always start from `dandiset.get_raw_metadata()` which
includes server-generated fields (`id`, `citation`, `assetsSummary`, `manifestLocation`).
Mutate only the fields you control (name, description, contributors, etc.), then validate
the **complete** metadata dict. Do NOT strip server-generated fields before validation —
they are required by the schema.

**Set title and description:**
```python
metadata["name"] = title  # from OpenAlex or user
metadata["description"] = description  # paper abstract or user-provided
metadata["keywords"] = ["hippocampus", "electrophysiology", "place cells"]  # user-provided
```

**Set contributors (persons):**
Convert OpenAlex author names from "First Last" to "Last, First" format. Mark the
corresponding author as ContactPerson. Mark all authors with `includeInCitation: True`.

```python
contributors = []
for authorship in work["authorships"]:
    author = authorship["author"]
    display_name = author["display_name"]
    # Convert "First Last" → "Last, First"
    parts = display_name.rsplit(" ", 1)
    dandi_name = f"{parts[-1]}, {parts[0]}" if len(parts) == 2 else display_name

    orcid = author.get("orcid", "").replace("https://orcid.org/", "")
    roles = ["dcite:Author"]
    if authorship["is_corresponding"]:
        roles.append("dcite:ContactPerson")

    person = {
        "schemaKey": "Person",
        "name": dandi_name,
        "roleName": roles,
        "includeInCitation": True,
    }
    if orcid:
        person["identifier"] = orcid
    # Add email for contact person (ask user)
    if authorship["is_corresponding"]:
        person["email"] = contact_email  # must ask user for this

    # Add affiliation — IMPORTANT: schemaKey must be "Affiliation", not "Organization"
    # "Organization" is for top-level contributors (funders); "Affiliation" is for person affiliations
    affiliations = []
    for inst in authorship.get("institutions", []):
        aff = {
            "schemaKey": "Affiliation",
            "name": inst["display_name"],
        }
        if inst.get("ror"):
            aff["identifier"] = inst["ror"]
        affiliations.append(aff)
    if affiliations:
        person["affiliation"] = affiliations

    contributors.append(person)
```

**Add data curators (the people who performed the conversion):**

Data curators are NOT authors — they get `dcite:DataCurator` role only, and
`includeInCitation: False` unless they made intellectual contributions to the dataset.

```python
# Add each person who worked on the NWB conversion
contributors.append({
    "schemaKey": "Person",
    "name": "Last, First",  # person who ran the conversion
    "identifier": "0000-0001-2345-6789",  # their ORCID
    "roleName": ["dcite:DataCurator"],
    "includeInCitation": False,
    "email": "curator@example.com",
    "affiliation": [{"schemaKey": "Affiliation", "name": "CatalystNeuro"}],
})
```

**Add funders as Organization contributors:**
```python
for grant in work.get("grants", []):
    funder = {
        "schemaKey": "Organization",
        "name": grant["funder_display_name"],
        "roleName": ["dcite:Funder"],
        "includeInCitation": False,
    }
    if grant.get("funder", {}).get("ror"):
        funder["identifier"] = grant["funder"]["ror"]
    if grant.get("funder_award_id"):
        funder["awardNumber"] = grant["funder_award_id"]
    contributors.append(funder)
```

**Set contributors on metadata:**
```python
metadata["contributor"] = contributors
```

**Add related resources:**
```python
related = []

# Associated publication
related.append({
    "schemaKey": "Resource",
    "identifier": f"doi:{doi}",
    "url": f"https://doi.org/{doi}",
    "name": title,
    "relation": "dcite:IsDescribedBy",
    "resourceType": "dcite:JournalArticle",  # or dcite:Preprint
})

# Conversion code repo (if on GitHub)
related.append({
    "schemaKey": "Resource",
    "url": "https://github.com/catalystneuro/lab-to-nwb",
    "name": "NWB conversion code",
    "relation": "dcite:IsSupplementedBy",
    "resourceType": "dcite:Software",
})

metadata["relatedResource"] = related
```

**Add ontology terms to `about` (from 7c results):**
```python
metadata["about"] = [
    {"schemaKey": "Anatomy", "name": "hippocampal formation", "identifier": "UBERON:0002421"},
    # add more terms as appropriate for the experiment
]
```

**Add ethics approval (ask user):**
```python
metadata["ethicsApproval"] = [{
    "schemaKey": "EthicsApproval",
    "identifier": "IACUC Protocol #12345",  # ask user
    "contactPoint": {
        "schemaKey": "ContactPoint",
        "name": "Columbia University IACUC",  # ask user
    },
}]
```

**Set license and access:**
```python
metadata["license"] = ["spdx:CC-BY-4.0"]
metadata["access"] = [{
    "schemaKey": "AccessRequirements",
    "status": "dandi:OpenAccess",
}]
```

**Validate and save (uses the wrapper defined above — never call `set_raw_metadata` directly):**
```python
validate_and_save(dandiset, metadata)
```

#### 7e. Metadata Quality Checklist

Before saving, verify the metadata covers all quality criteria:

- [ ] Is the title descriptive and publication-quality?
- [ ] Does the description mention data modalities and recording methods?
- [ ] Does the description include a brief methodology summary?
- [ ] Are associated publications linked with DOIs and correct relation (`dcite:IsDescribedBy`)?
- [ ] Are all paper authors listed as contributors with ORCIDs?
- [ ] Do contributors have institutional affiliations with ROR identifiers?
- [ ] Are funders listed with award numbers and ROR identifiers?
- [ ] Are relevant brain regions / anatomical structures in the `about` field (UBERON)?
- [ ] Is the license specified (`spdx:CC-BY-4.0`)?
- [ ] Is the IACUC/IRB protocol number included in `ethicsApproval`?
- [ ] Are keywords provided for discoverability?
- [ ] Is at least one contributor marked as `dcite:ContactPerson` with an email?

#### 7f. Additional Metadata to Ask the User

After auto-populating from OpenAlex, ask the user for anything that can't be extracted:

> I've populated the metadata from your paper. A few more things:
>
> 1. **Contact person email**: What email should be listed for the contact person?
> 2. **Ethics approval**: What is your IACUC/IRB protocol number and institution?
> 3. **Keywords**: What keywords should I add for discoverability?
> 4. **Brain regions**: What brain regions were recorded? I'll look up the UBERON terms.
> 5. **Any additional contributors** not on the paper (e.g., data curators, technicians)?

#### Publishing

> When all metadata is complete and you're ready to make your dataset permanently citable:
> 1. Review the metadata at your Dandiset URL
> 2. Click "Publish" on the Dandiset page
> 3. This creates an immutable version with a DOI
> 4. The DOI can be used in publications to reference this exact version of the data
>
> Note: You can continue uploading files and publish new versions later. Each version
> gets its own DOI.

### Step 8: Set Asset-Level Metadata (Brain Region per Subject)

After uploading and setting dandiset-level metadata, set per-asset metadata — particularly
brain region when it varies across subjects or sessions. DANDI assets support an `about`
field (same schema as dandiset-level) that can hold `Anatomy` terms per file.

#### 8a. Build a Subject → Brain Region Mapping

Ask the user which brain regions each subject was recorded from. Often this is already
known from Phase 3 metadata collection or from the NWB files themselves:

> Different subjects may have implants in different brain regions. Can you tell me
> which brain region(s) each subject was recorded from? For example:
> - Subject A001: CA1
> - Subject A002: V1, LM
> - Subject A003: mPFC

Or extract it programmatically from the NWB files if `electrodes.location` or
`ImagingPlane.location` is set:

```python
from pynwb import NWBHDF5IO
from pathlib import Path

subject_regions = {}
for nwb_path in sorted(Path("./000123").rglob("*.nwb")):
    with NWBHDF5IO(str(nwb_path), "r") as io:
        nwbfile = io.read()
        subject_id = nwbfile.subject.subject_id if nwbfile.subject else None
        regions = set()

        # From electrodes table
        if nwbfile.electrodes and "location" in nwbfile.electrodes.colnames:
            for loc in nwbfile.electrodes["location"].data[:]:
                if loc and loc != "unknown":
                    regions.add(loc)

        # From imaging planes
        if "ophys" in nwbfile.processing:
            for container in nwbfile.processing["ophys"].data_interfaces.values():
                if hasattr(container, "imaging_plane"):
                    loc = container.imaging_plane.location
                    if loc and loc != "unknown":
                        regions.add(loc)

        if subject_id and regions:
            subject_regions[subject_id] = list(regions)

print(subject_regions)
# e.g., {"C005": ["nucleus accumbens"], "C015": ["nucleus accumbens", "ventral tegmental area"]}
```

#### 8b. Look Up UBERON Terms

Use the same `lookup_ontology_term` function from Step 7c to resolve brain region names
to UBERON identifiers. **Use full OBO URIs** (not compact CURIEs like `UBERON:0002421`)
because the DANDI asset schema requires `"format": "uri"` on identifiers.

Present results to the user for confirmation:

```python
region_to_uberon = {}
for regions in subject_regions.values():
    for region in regions:
        if region not in region_to_uberon:
            terms = lookup_ontology_term(region, "uberon")
            if terms:
                best = terms[0]
                region_to_uberon[region] = {
                    "schemaKey": "Anatomy",
                    "name": best["label"],
                    "identifier": best["iri"],  # Full OBO URI, e.g., "http://purl.obolibrary.org/obo/UBERON_0012171"
                }
```

#### 8c. Apply Brain Region to Each Asset

Use the DANDI REST API directly to update each asset's `about` field. The workflow
is: list assets → GET metadata → update `about` → PUT back with `blob_id`.

**Note**: Each PUT creates a new asset version with a new `asset_id`.

```python
import requests

DANDI_API = "https://api.dandiarchive.org/api"  # or sandbox
HEADERS = {"Authorization": f"token {api_key}", "Content-Type": "application/json"}
DANDISET_ID = "000123"

# List all assets
resp = requests.get(f"{DANDI_API}/dandisets/{DANDISET_ID}/versions/draft/assets/", headers=HEADERS)
assets = resp.json()["results"]

for asset_info in assets:
    asset_id = asset_info["asset_id"]
    blob_id = asset_info["blob"]
    path = asset_info["path"]

    # Extract subject_id from path (e.g., "sub-C005/sub-C005_ses-xxx.nwb")
    subject_id = path.split("/")[0].replace("sub-", "") if path.startswith("sub-") else None
    if not subject_id or subject_id not in subject_regions:
        continue

    # Build anatomy entries for this subject
    about = [region_to_uberon[r] for r in subject_regions[subject_id] if r in region_to_uberon]
    if not about:
        continue

    # GET current asset metadata
    meta_resp = requests.get(f"{DANDI_API}/assets/{asset_id}/", headers=HEADERS)
    metadata = meta_resp.json()
    metadata["about"] = about

    # PUT updated metadata
    put_resp = requests.put(
        f"{DANDI_API}/dandisets/{DANDISET_ID}/versions/draft/assets/{asset_id}/",
        headers=HEADERS,
        json={"metadata": metadata, "blob_id": blob_id},
    )
    if put_resp.status_code == 200:
        print(f"  {path}: {[a['name'] for a in about]}")
    else:
        print(f"  {path}: FAILED {put_resp.status_code} - {put_resp.text[:200]}")
```

If the dandiset has many assets, paginate through them:
```python
url = f"{DANDI_API}/dandisets/{DANDISET_ID}/versions/draft/assets/"
while url:
    resp = requests.get(url, headers=HEADERS)
    data = resp.json()
    for asset_info in data["results"]:
        # ... same update logic as above
        pass
    url = data.get("next")
```

#### 8d. Verify Asset Metadata

Spot-check a few assets to confirm the metadata was saved:

```python
resp = requests.get(f"{DANDI_API}/dandisets/{DANDISET_ID}/versions/draft/assets/", headers=HEADERS)
for asset_info in resp.json()["results"][:5]:
    meta = requests.get(f"{DANDI_API}/assets/{asset_info['asset_id']}/", headers=HEADERS).json()
    about = meta.get("about", [])
    print(f"  {asset_info['path']}: {[a['name'] for a in about] if about else '(none)'}")
```

### Testing with Sandbox

For testing uploads before going to production:

```python
# Use the sandbox server
automatic_dandi_upload(
    dandiset_id="000123",
    nwb_folder_path="./nwb_output",
    sandbox=True,  # Upload to sandbox.dandiarchive.org
)
```

Or with the CLI:
```bash
# Get your sandbox API key from https://sandbox.dandiarchive.org/
export DANDI_API_KEY=your_sandbox_key

# Upload to sandbox
dandi upload -i dandi-sandbox
```

For programmatic metadata editing on the sandbox, use:
```python
from dandi.dandiapi import DandiAPIClient

client = DandiAPIClient(api_url="https://api.sandbox.dandiarchive.org/api")
client.dandi_authenticate()
dandiset = client.get_dandiset("000123", "draft")
# ... same metadata operations as production
```

The sandbox server is at https://sandbox.dandiarchive.org/ (API: https://api.sandbox.dandiarchive.org/) —
create a separate account and Dandiset there for testing.

### Step 9: Write Conversion Manifest

After the upload is complete and metadata is set, write a `conversion_manifest.yaml` to the
conversion repo. This manifest captures structured metadata about what was built, enabling
the weekly registry scan to aggregate it for future conversions.

Build the manifest from the conversion artifacts you've created throughout the engagement:

```yaml
# conversion_manifest.yaml (in repo root)
schema_version: 1
lab: "<Lab Name>"
conversions:
  - name: "<conversion_name>"
    status: completed
    species: "<binomial, e.g., Mus musculus>"
    modalities: [ecephys, behavior]  # from Phase 1
    neuroconv_interfaces:
      - name: SpikeGLXRecordingInterface
        file_patterns: ["*.ap.bin", "*.ap.meta"]
      - name: SpikeGLXLFPInterface
        file_patterns: ["*.lf.bin", "*.lf.meta"]
      - name: PhySortingInterface
        file_patterns: ["spike_times.npy", "cluster_group.tsv"]
    custom_interfaces:
      - name: "<CustomInterfaceName>"
        file: "src/<package>/<conversion>/interfaces/<filename>.py"
        handles: "<brief description of what file format it reads>"
        creates: [Position, BehavioralEvents]  # NWB types created
        file_patterns: ["events.csv", "trials.csv"]
    extensions: []  # any ndx-* extensions used
    sync_approach: "<ttl_based|shared_clock|software_sync|none>"
    dandi_id: "<6-digit dandiset ID>"
    pattern: "<standard_nwbconverter|converter_pipe|custom>"
    lessons:
      - "<any gotchas, quirks, or tips discovered during this conversion>"
    date_completed: "<YYYY-MM-DD>"
```

**How to populate each field:**
- `name`: The conversion subdirectory name (e.g., `experiment_2026`)
- `modalities`: Collect from the Data Streams table in `conversion_notes.md`
- `neuroconv_interfaces`: From the Interface Mapping table in `conversion_notes.md`.
  Each entry has `name` (the interface class) and `file_patterns` (globs that this
  interface handles, from Phase 2 inspection).
- `custom_interfaces`: From any custom DataInterface classes you wrote in Phase 5.
  Include `file_patterns` for the files each custom interface reads.
- `extensions`: Any `ndx-*` packages used (e.g., `ndx-fiber-photometry`, `ndx-pose`)
- `sync_approach`: From Phase 4 sync plan
- `dandi_id`: The Dandiset ID from this phase
- `lessons`: Anything surprising, non-obvious, or worth knowing for future similar conversions
- `date_completed`: Today's date

**Commit and push the manifest** (remote was configured in Phase 1 via the API):
```bash
git add conversion_manifest.yaml
git commit -m "Add conversion manifest for registry

Dandiset: <dandi_id>
Modalities: <modalities>
Interfaces: <N> NeuroConv + <N> custom"
if git remote get-url origin &>/dev/null; then git push; fi
```

If the repo is in the `nwb-conversions` org (the normal case when the API is reachable),
the weekly registry scan will find it automatically — no further action needed.

If working locally (API was unreachable), inform the user:
> The conversion manifest has been saved locally. To include this conversion in the
> registry for future reference, contact CatalystNeuro for assistance.

### Step 10: Save Conversation History

Save the Claude Code conversation that produced this conversion into the repo. This
captures every decision, data inspection, question, and code generation step for
full reproducibility.

```bash
# Find the active Claude Code conversation JSONL (most recently modified)
CONVERSATION=$(ls -t ~/.claude/projects/*/*.jsonl 2>/dev/null | head -1)
if [ -n "$CONVERSATION" ]; then
    mkdir -p .claude
    cp "$CONVERSATION" .claude/conversation.jsonl
    git add .claude/conversation.jsonl
    git commit -m "Save Claude Code conversation history"
    if git remote get-url origin &>/dev/null; then git push; fi
    echo "Saved conversation: $(du -h .claude/conversation.jsonl | cut -f1)"
else
    echo "No conversation JSONL found — skipping"
fi
```

The conversation file is a JSONL containing the full exchange between the user and Claude
Code, including tool calls, file reads, and data inspection outputs. It can be replayed
to understand exactly how the conversion was built.

### Common Issues

- **"Unable to find environment variable DANDI_API_KEY"**: Set the API key with `export DANDI_API_KEY=...`
- **Validation errors**: Run `nwbinspector` and `dandi validate` to identify issues
- **Files too large**: DANDI supports files up to 5TB. Contact DANDI team for datasets >10TB
- **Path too long**: DANDI has a 512-character path limit. Shorten session/subject IDs if needed
- **Organize step fails**: Ensure NWB files have `subject.subject_id` and `session_id` set
- **Upload hangs**: Try with `number_of_jobs=1` and `number_of_threads=1` for debugging.
  Check logs at `~/Library/Logs/dandi-cli` (macOS) or `~/.cache/dandi-cli/log` (Linux)

### Add Upload to convert_all_sessions.py

Optionally add upload as the final step of batch conversion:

```python
def dataset_to_nwb(
    data_dir_path,
    output_dir_path,
    dandiset_id=None,
    max_workers=1,
    stub_test=False,
):
    # ... run all conversions ...

    if dandiset_id and not stub_test:
        from neuroconv.tools.data_transfers import automatic_dandi_upload
        automatic_dandi_upload(
            dandiset_id=dandiset_id,
            nwb_folder_path=output_dir_path,
        )
```
