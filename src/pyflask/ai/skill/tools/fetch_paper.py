#!/usr/bin/env python3
"""Fetch full text of a scientific paper and extract specific information.

Usage:
    python fetch_paper.py <identifier> [--extract <section>] [--query <question>]

Identifier can be:
    - DOI (e.g., 10.1038/s41586-019-1234-5)
    - PMID (e.g., 31234567)
    - PMC ID (e.g., PMC6789012)
    - URL from doi.org, pubmed, pmc, or europepmc

Examples:
    python fetch_paper.py 10.1126/science.aav7893
    python fetch_paper.py 10.1126/science.aav7893 --extract methods
    python fetch_paper.py PMC6525101 --extract methods
    python fetch_paper.py 31000656 --extract abstract
"""

import argparse
import json
import re
import sys
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError
from urllib.parse import quote


def parse_identifier(raw: str) -> dict:
    """Parse a DOI, PMID, PMC ID, or URL into a normalized identifier."""
    raw = raw.strip()

    # URL patterns
    doi_url = re.match(r"https?://(?:dx\.)?doi\.org/(.+)", raw)
    if doi_url:
        return {"type": "doi", "id": doi_url.group(1)}

    pubmed_url = re.match(r"https?://(?:www\.)?ncbi\.nlm\.nih\.gov/pubmed/(\d+)", raw)
    if pubmed_url:
        return {"type": "pmid", "id": pubmed_url.group(1)}

    pmc_url = re.match(r"https?://(?:www\.)?ncbi\.nlm\.nih\.gov/pmc/articles/(PMC\d+)", raw)
    if not pmc_url:
        pmc_url = re.match(r"https?://pmc\.ncbi\.nlm\.nih\.gov/articles/(PMC\d+)", raw)
    if pmc_url:
        return {"type": "pmc", "id": pmc_url.group(1)}

    europepmc_url = re.match(r"https?://europepmc\.org/article/(\w+)/(\d+)", raw)
    if europepmc_url:
        return {"type": europepmc_url.group(1).lower(), "id": europepmc_url.group(2)}

    # Raw identifiers
    if raw.upper().startswith("PMC"):
        return {"type": "pmc", "id": raw.upper()}
    if raw.isdigit() and len(raw) >= 7:
        return {"type": "pmid", "id": raw}
    if "/" in raw:
        return {"type": "doi", "id": raw}

    return {"type": "unknown", "id": raw}


def fetch_url(url: str, accept: str = "application/json") -> str:
    """Fetch a URL and return the response text."""
    req = Request(url, headers={"Accept": accept, "User-Agent": "NWB-GUIDE/1.0"})
    with urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8")


def resolve_ids(identifier: dict) -> dict:
    """Resolve any identifier to DOI, PMID, and PMC ID using NCBI converter."""
    id_val = identifier["id"]

    if identifier["type"] == "pmc":
        id_val = identifier["id"].replace("PMC", "")
        query_id = f"PMC{id_val}"
    else:
        query_id = id_val

    url = f"https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/?tool=nwbguide&format=json&ids={quote(query_id)}"
    try:
        data = json.loads(fetch_url(url))
        records = data.get("records", [])
        if records and records[0].get("status") != "error":
            r = records[0]
            return {
                "doi": r.get("doi"),
                "pmid": str(r["pmid"]) if "pmid" in r else None,
                "pmcid": r.get("pmcid"),
            }
    except Exception:
        pass

    # Return what we have
    result = {"doi": None, "pmid": None, "pmcid": None}
    result[identifier["type"]] = identifier["id"]
    return result


def fetch_bioc_fulltext(pmcid: str) -> dict | None:
    """Fetch full text via NCBI BioC API (best for open access papers).

    Returns parsed sections dict or None.
    """
    numeric = pmcid.replace("PMC", "")
    url = f"https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_json/PMC{numeric}/unicode"
    try:
        data = json.loads(fetch_url(url))
    except Exception:
        return None

    sections = {}
    documents = data if isinstance(data, list) else [data]

    for doc in documents:
        for passage in doc.get("documents", [{}])[0].get("passages", []):
            infons = passage.get("infons", {})
            sec_type = infons.get("section_type", "").lower()
            text = passage.get("text", "")

            if not text.strip():
                continue

            # Normalize section names
            if sec_type in ("title",):
                key = "title"
            elif sec_type in ("abstract",):
                key = "abstract"
            elif sec_type in ("intro", "introduction"):
                key = "introduction"
            elif sec_type in ("methods", "materials", "materials and methods", "experimental"):
                key = "methods"
            elif sec_type in ("results", "results and discussion"):
                key = "results"
            elif sec_type in ("discuss", "discussion"):
                key = "discussion"
            elif sec_type in ("suppl", "supplementary", "supplementary material"):
                key = "supplementary"
            elif sec_type in ("ack", "acknowledgements", "acknowledgments", "funding"):
                key = "acknowledgements"
            elif sec_type in ("ref", "references"):
                continue  # skip references
            elif "data" in sec_type and "avail" in sec_type:
                key = "data_availability"
            elif sec_type in ("fig", "fig_title_caption", "table", "table_title_caption"):
                key = "figures_tables"
            elif sec_type:
                key = sec_type.replace(" ", "_")[:40]
            else:
                key = "body"

            if key in sections:
                sections[key] += "\n" + text
            else:
                sections[key] = text

    return sections if sections else None


def fetch_pubmed_abstract(pmid: str) -> dict | None:
    """Fetch abstract from PubMed E-utilities as fallback."""
    import xml.etree.ElementTree as ET

    url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id={pmid}&rettype=xml"
    try:
        xml_text = fetch_url(url, accept="text/xml")
        root = ET.fromstring(xml_text)

        sections = {}

        # Title
        title_el = root.find(".//ArticleTitle")
        if title_el is not None and title_el.text:
            sections["title"] = title_el.text

        # Abstract
        abstract_parts = []
        for abs_el in root.findall(".//AbstractText"):
            label = abs_el.get("Label", "")
            text = "".join(abs_el.itertext())
            if label:
                abstract_parts.append(f"{label}: {text}")
            else:
                abstract_parts.append(text)
        if abstract_parts:
            sections["abstract"] = "\n".join(abstract_parts)

        # Keywords
        kw = [el.text for el in root.findall(".//Keyword") if el.text]
        if kw:
            sections["keywords"] = ", ".join(kw)

        # Journal
        journal_el = root.find(".//Journal/Title")
        if journal_el is not None and journal_el.text:
            sections["journal"] = journal_el.text

        return sections if sections else None
    except Exception:
        return None


def fetch_europepmc_abstract(identifier: dict) -> dict | None:
    """Search Europe PMC and return article metadata + abstract."""
    id_type = identifier["type"]
    id_val = identifier["id"]

    if id_type == "doi":
        query = f'DOI:"{id_val}"'
    elif id_type == "pmid":
        query = f"EXT_ID:{id_val} AND SRC:MED"
    elif id_type == "pmc":
        query = f"PMCID:{id_val}"
    else:
        query = id_val

    url = f"https://www.ebi.ac.uk/europepmc/webservices/rest/search?query={quote(query)}&format=json&resultType=core&pageSize=1"
    try:
        data = json.loads(fetch_url(url))
        results = data.get("resultList", {}).get("result", [])
        if not results:
            return None

        r = results[0]
        sections = {}
        if r.get("title"):
            sections["title"] = r["title"]
        if r.get("abstractText"):
            sections["abstract"] = r["abstractText"]
        if r.get("journalTitle"):
            sections["journal"] = r["journalTitle"]
        if r.get("keywordList", {}).get("keyword"):
            sections["keywords"] = ", ".join(r["keywordList"]["keyword"])

        return sections if sections else None
    except Exception:
        return None


def fetch_paper(raw_identifier: str) -> dict:
    """Fetch a paper and return structured sections.

    Strategy:
    1. Resolve identifier to DOI/PMID/PMCID
    2. Try BioC full text (best for open access PMC papers)
    3. Fall back to PubMed abstract
    4. Fall back to Europe PMC abstract
    """
    identifier = parse_identifier(raw_identifier)
    ids = resolve_ids(identifier)

    result = {
        "identifier": identifier,
        "resolved_ids": ids,
        "source": None,
        "sections": {},
        "has_full_text": False,
        "error": None,
    }

    # Try BioC full text if we have a PMC ID
    if ids.get("pmcid"):
        sections = fetch_bioc_fulltext(ids["pmcid"])
        if sections:
            result["source"] = "pmc_bioc"
            result["sections"] = sections
            result["has_full_text"] = True
            return result

    # Try PubMed abstract
    if ids.get("pmid"):
        sections = fetch_pubmed_abstract(ids["pmid"])
        if sections:
            result["source"] = "pubmed"
            result["sections"] = sections
            return result

    # Try Europe PMC
    sections = fetch_europepmc_abstract(identifier)
    if sections:
        result["source"] = "europepmc"
        result["sections"] = sections
        return result

    result["error"] = f"Could not fetch paper for: {raw_identifier}"
    return result


def main():
    parser = argparse.ArgumentParser(
        description="Fetch scientific paper full text or abstract",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("identifier", help="DOI, PMID, PMC ID, or URL")
    parser.add_argument("--extract", help="Section to extract (e.g., methods, results, abstract, all)")
    parser.add_argument("--query", help="Specific question — printed as reminder after the text")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    paper = fetch_paper(args.identifier)

    if paper["error"] and not paper["sections"]:
        print(f"ERROR: {paper['error']}", file=sys.stderr)
        sys.exit(1)

    sections = paper["sections"]

    if args.json:
        out = {k: v[:8000] for k, v in sections.items()}
        out["_source"] = paper["source"]
        out["_has_full_text"] = paper["has_full_text"]
        out["_resolved_ids"] = paper["resolved_ids"]
        if paper["error"]:
            out["_warning"] = paper["error"]
        print(json.dumps(out, indent=2))
        return

    # Header
    print(f"Source: {paper['source']}")
    print(f"Full text: {'yes' if paper['has_full_text'] else 'no (abstract only)'}")
    ids = paper["resolved_ids"]
    id_strs = [f"{k}={v}" for k, v in ids.items() if v]
    if id_strs:
        print(f"IDs: {', '.join(id_strs)}")
    print()

    if args.extract and args.extract.lower() != "all":
        key = args.extract.lower().strip()
        if key in sections:
            print(f"=== {key.upper()} ===")
            print(sections[key][:10000])
            if len(sections[key]) > 10000:
                print(f"\n... [truncated, {len(sections[key])} chars total]")
        else:
            print(f"Section '{key}' not found.")
            print(f"Available sections: {', '.join(sections.keys())}")
            if "abstract" in sections:
                print(f"\n=== ABSTRACT (fallback) ===")
                print(sections["abstract"])
    else:
        for key, text in sections.items():
            print(f"=== {key.upper()} ===")
            limit = 10000 if args.extract == "all" else 3000
            print(text[:limit])
            if len(text) > limit:
                print(f"... [truncated, {len(text)} chars total]")
            print()

    if args.query:
        print(f"\n{'='*60}")
        print(f"QUERY: {args.query}")
        print(f"{'='*60}")
        print("(Review the text above to answer this question)")


if __name__ == "__main__":
    main()
