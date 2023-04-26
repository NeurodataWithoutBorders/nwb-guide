Developer Guide
===============


Coding Style and pre-commit
---------------------------

For all Python code on the back-end or API, we use the :black-coding-style:`black coding style <>` with parameters defined in the ``pyproject.toml`` configuration file. We use an automated pre-commit bot to enforce these on the main repo, but contributions from external forks would either have to grant bot permissions on their own fork (via :pre-commit-bot:`the pre-commit bot website <>`) or run pre-commit manually. For instructions to install pre-commit, as well as some other minor coding styles we follow, refer to the :neuroconv-coding-style:`NeuroConv style guide <>`.

testing
