import sys
import inspect
from pathlib import Path
import json
import os

sys.path.insert(0, str(Path(__file__).resolve().parents[0]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from conf_extlinks import extlinks, intersphinx_mapping  # noqa: E402, F401


project = "NWB GUIDE"
copyright = "2022, CatalystNeuro"  # TODO: how to include NWB?
author = "Garrett Flynn, Cody Baker, Ryan Ly, Oliver Ruebel, and Ben Dichter"

extensions = [
    "sphinx.ext.napoleon",  # Support for NumPy and Google style docstrings
    "sphinx.ext.autodoc",  # Includes documentation from docstrings in docs/api
    "sphinx.ext.intersphinx",  # Allows links to other sphinx project documentation sites
    "sphinx_search.extension",  # Allows for auto search function the documentation
    "sphinx.ext.viewcode",  # Shows source code in the documentation
    "sphinx.ext.extlinks",  # Allows to use shorter external links defined in the extlinks variable.
    "sphinx_favicon",  # Allows to set a favicon for the documentation
]

templates_path = ["_templates"]
master_doc = "index"
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]
html_theme = "pydata_sphinx_theme"
html_title = "NWB GUIDE"
html_static_path = ["_static"]

html_show_sourcelink = False

html_logo = "assets/logo-guide-draft-transparent-tight.png"

# configure the favicon via the sphinx_favicon extension
favicons = [
    "favicon.ico",
    "favicon-16x16.png",
    "favicon-32x32.png",
    "android-chrome-192x192.png",
    "android-chrome-512x512.png",
    "apple-touch-icon.png",
]

# These paths are either relative to html_static_path or fully qualified paths (eg. https://...)
# html_css_files = [
#     "css/custom.css",
# ]

linkcheck_anchors = False

# --------------------------------------------------
# Extension configuration
# --------------------------------------------------

# Napoleon
napoleon_google_docstring = False
napoleon_numpy_docstring = True
napoleon_use_param = False
napoleon_use_ivar = True
napoleon_include_init_with_doc = False
napoleon_include_private_with_doc = True
napoleon_include_special_with_doc = True

# Autodoc
autoclass_content = "both"  # Concatenates docstring of the class with that of its __init__
autodoc_member_order = "bysource"  # Displays classes and methods by their order in source code
autodata_content = "both"
autodoc_default_options = {
    "members": True,
    "member-order": "bysource",
    "private-members": True,
    "show-inheritance": False,
    "toctree": True,
}
add_module_names = False

# Define the json_url for our version switcher.
json_url = "https://nwb-guide.readthedocs.io/en/latest/_static/switcher.json"

# Define the version we use for matching in the version switcher.
# Adapted from https://github.com/pydata/pydata-sphinx-theme/blob/a4eaf774f97400d12d9cfc53b410122f1a8d88c6/docs/conf.py
version_match = os.environ.get("READTHEDOCS_VERSION")
with open("../package.json") as f:
    release = json.load(f)["version"]
# If READTHEDOCS_VERSION doesn't exist, we're not on RTD
# If it is an integer, we're in a PR build and the version isn't correct.
# If it's "latest" → change to "dev" (that's what we want the switcher to call it)
if not version_match or version_match.isdigit() or version_match == "latest":
    # For local development, infer the version to match from the package.
    if "dev" in release or "rc" in release:
        version_match = "dev"
        # We want to keep the relative reference if we are in dev mode
        # but we want the whole url if we are effectively in a released version
        json_url = "_static/switcher.json"
    else:
        version_match = f"v{release}"
elif version_match == "stable":
    version_match = f"v{release}"

html_theme_options = {
    "use_edit_page_button": True,
    "icon_links": [
        {
            "name": "GitHub",
            "url": "https://github.com/NeurodataWithoutBorders/nwb-guide",
            "icon": "fa-brands fa-github",
            "type": "fontawesome",
        },
    ],
    "switcher": {
        "json_url": json_url,
        "version_match": version_match,
    },
    "logo": {
        "text": "NWB GUIDE",
        "alt_text": "NWB GUIDE - Home",
    },
    "navbar_start": ["navbar-logo", "version-switcher"]
}

html_context = {
    # "github_url": "https://github.com", # or your GitHub Enterprise site
    "github_user": "NeurodataWithoutBorders",
    "github_repo": "nwb-guide",
    "github_version": "main",
    "doc_path": "docs",
}


def _correct_signatures(app, what, name, obj, options, signature, return_annotation):
    if what == "class":
        signature = str(inspect.signature(obj.__init__)).replace("self, ", "")
    return (signature, return_annotation)


def setup(app):  # This makes the data-interfaces signatures display on the docs/api, they don't otherwise
    app.connect("autodoc-process-signature", _correct_signatures)
