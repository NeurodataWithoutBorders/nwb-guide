# Use this for mapping to external links
extlinks = {
    "pynwb-docs": ("https://pynwb.readthedocs.io/en/stable/%s", "%s"),
    "matnwb-src": ("https://github.com/NeurodataWithoutBorders/matnwb/%s", "%s"),
    "nwb-overview": ("https://nwb-overview.readthedocs.io/en/latest/%s", "%s"),
    "conda-install": (
        "https://docs.conda.io/projects/conda/en/latest/user-guide/install/index.html#regular-installation%s",
        "%s",
    ),
    "nwbinspector-issues": ("https://github.com/NeurodataWithoutBorders/nwbinspector/issues/%s", None),
    "nwbinspector-contributing": (
        "https://github.com/NeurodataWithoutBorders/nwbinspector/blob/dev/.github/CONTRIBUTING.md%s",
        None,
    ),
    "dandi-archive": ("https://dandiarchive.org/%s", "%s"),
    "ros3-tutorial": (
        "https://pynwb.readthedocs.io/en/stable/tutorials/advanced_io/streaming.html#streaming-method-2-ros3%s",
        None,
    ),
    "alternative-streaming-tutorial": (
        "https://pynwb.readthedocs.io/en/stable/tutorials/advanced_io/streaming.html#streaming-method-1-fsspec%s",
        None,
    ),
    "wikipedia": ("https://en.wikipedia.org/wiki/%s", "%s"),
    "allen-brain-map": ("https://%s.brain-map.org/", "%s"),
    "uuid": ("https://docs.python.org/3/library/uuid.html%s", None),
    "orcid": ("https://orcid.org/%s", "%s"),
    "pre-commit-bot": ("https://results.pre-commit.ci/%s", None),
    "neuroconv-coding-style": (
        "https://neuroconv.readthedocs.io/en/main/developer_guide/style_guide.html#style-guide-and-general-conventions%s",
        None,
    ),
    "pytest": ("https://docs.pytest.org/en/stable/%s", None),
    "black-coding-style": ("https://black.readthedocs.io/en/stable/the_black_code_style/current_style.html%s", None),
    "prettier-code-formatter": ("https://prettier.io/docs/en/%s", None),

    "ncbi": ("https://www.ncbi.nlm.nih.gov/taxonomy%s", None),
    "ontobee": ("https://ontobee.org/%s", None),

    "web-components": ("https://www.webcomponents.org/%s", None),
    "npm": ("https://www.npmjs.com/%s", None)
}

# Use this for mapping for links to commonly used documentation
intersphinx_mapping = {
    "pynwb": ("https://pynwb.readthedocs.io/en/stable/", None),
    "nwb-schema": ("https://nwb-schema.readthedocs.io/en/latest/", None),
    "hdmf-schema": ("https://hdmf-common-schema.readthedocs.io/en/stable/", None),
}
