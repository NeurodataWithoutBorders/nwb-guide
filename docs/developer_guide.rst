Developer Guide
===============

We welcome contributions from the community! If you are interested in contributing, please read the following guide to get started.



.. _developer_installation:

Installation
------------

Clone the Repo
^^^^^^^^^^^^^^

Start by cloning the repository

.. code-block:: bash

    git clone https://github.com/NeurodataWithoutBorders/nwb-guide
    cd nwb-guide


Install Python Dependencies
^^^^^^^^^^^^^^^^^^^^^^^^^^^

Install the appropriate Python dependencies for your operating system.

**Windows**

.. code-block:: bash

    conda env create --file ./environments/environment-Windows.yml

**Mac with x64 architecture**

.. code-block:: bash

    conda env create --file ./environments/environment-MAC-intel.yml

**Mac with arm64 architecture**

.. code-block:: bash

    conda env create --file ./environments/environment-MAC-apple-silicon.yml

**Linux**

.. code-block:: bash

    conda env create --file ./environments/environment-Linux.yml


.. note::

    The NWB GUIDE environment can be quite large. If your base folder for ``conda`` is on a small mounted partition, you may need to setup the environment elsewhere on your system. You can do this using:

    .. code-block:: bash

        conda env create --file ./environments/environment-< platform >.yml --prefix < explicit location to setup environment >

    For example, on a remote Linux server, this might look like:

    .. code-block:: bash

        conda env create --file ./environments/environment-Linux.yml --prefix /mnt/data/nwb-guide


Activate the Python Environment
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Before starting NWB GUIDE, you'll need to ensure that the Python environment is activated.

.. code-block:: bash

    conda activate nwb-guide

.. note::

    If you had to use the ``--prefix`` flag in the previous step, then this becomes

    .. code-block:: bash

        conda activate < explicit location of environment >

    Such as, using the previous example:

    .. code-block:: bash

        conda activate /mnt/data/nwb-guide


Install JavaScript Dependencies
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Next, install all JavaScript dependencies based on the `package-lock.json` file.

.. code-block:: bash

    npm ci


Run the Application
^^^^^^^^^^^^^^^^^^^

You can now run the following command to start the application using Electron.

.. code-block:: bash

    npm start


Repo Structure
--------------
- `src`
    - `electron`
        - `main`
            - `application-menu.js` - Configures the application window
            - `main.ts` - Configures the Python backend process
        - `preload`
            - `preload.js` - Exposes electron-specific variables to the frontend
        - `frontend`
            - `core` - Contains all the source code for the frontend
                - `index.ts` - The entry point for the application. Manages initial system and internet connection checks, and sets up auto-updating
                - `pages.js` - The main code that controls which pages are rendered and how they are linked together
                - `components` - Contains all the UI Components used throughout the app
            - `assets` - Contains all the frontend-facing assets (e.g. images, css, etc.)
            - `utils`
                - `electron.js` - Contains electron-exposed variables
                - `url.js` - Saving the history state for hot reloading and refresh page functionality
    - `pyflask` - Contains all the source code for the backend
    - `schemas` - Contains all the JSON schemas used for validation


Starting a New Feature
----------------------

1. Create a new branch off of the ``main`` branch. The branch name should be descriptive of the feature you are working on.

.. note::

    For example, if you are working on a feature to add a new page, you could name the branch ``add-new-metadata-page``.

2. Make your changes on the new branch.

.. important::

    When you are ready to commit, make sure to add :ref:`tests <testing>` for your new code as well.

1. Push your changes to the remote branch. Then, open a pull request to merge your branch into the ``main`` branch.

.. note::

    Make sure to add a description of the changes you made in the pull request.

4. Once the pull request is approved, merge it into the ``main`` branch. You can then delete the branch you created in step 1.



Adding a New Page
^^^^^^^^^^^^^^^^^

New pages can be added by linking a component in the ``src/electron/frontend/core/pages.js`` file.
For example, if you wanted to add a new page called ``NewPage``, you would add the following to the configuration file:

.. code-block:: javascript

    import NewPage from "./components/pages/new_page/NewPage";

    // ...

    const pages = {

        // ...

        uploads: new UploadsPage({
            label: "Upload",
            icon: uploadIcon,
        }),

        newpage: new NewPage({
            label: "New Page", // This is the label that will be displayed in the sidebar
        }),

        // ...

    }

    // ...

This will automatically add the new page to the sidebar. The page itself can be defined in the
``./components/pages/new_page/NewPage.js`` file. For example, if you wanted to add a new page that displays
a simple message, you could add the following to the ``./components/pages/new_page/NewPage.js`` file:


.. code-block:: javascript

    import { html } from "lit";
    import { Page } from '../../Page.js';

    export default class NewPage extends Page {
        constructor(...args) {
            super(...args);

            console.log(this.info.globalState) // This will print the global state that is currently being passed between subpages
        }

        render() {
            return html`
                <div>
                    <h1>${this.info.label}</h1>
                    <p>This is a new page!</p>
                </div>
            `;
        }
    }

Extending the ``Page`` class rather than the ``LitElement`` class provides each page with standard properties and
methods that allow for uniform handling across the application.


Discover Existing Components
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

While developing NWB GUIDE, you may find that you need to use a component that already exists in the codebase. To
find a component, you can manually peruse the ``src/stories`` directory or run the project's Storybook instance to
see all of the components in action.

To run Storybook, simply run ``npm run storybook`` in the root directory of the repository. This will start a local
server that you can access using the link provided on the command line.

To see if someone else has developed a third-party component to fit your needs, you can refer to
:web-components:`WebComponents.org <>` and search based on your particular needs. :npm:`NPM` may also be
useful to search for third-party packages (e.g. Handsontable) that implement the feature you need.


.. _documentation:

Documentation
-------------

Updating Tutorial Screenshots
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Before a release, you'll want to update the tutorial screenshots to reflect the latest changes in the application.

#. To regenerate the dataset, you'll need to change ``regenerateTestData`` in the ``tests/e2e/config.ts`` to ``true`` or delete the test dataset directory ``rm -rf ~/NWB_GUIDE/.test``.
#. Create a ``.env`` file with the following content: ``DANDI_STAGING_API_KEY={your_dandi_staging_api_key}`` where ``{your_dandi_staging_api_key}`` is your DANDI staging API key from https://gui-staging.dandiarchive.org.
#. Run the End-to-End Tests locally using ``npm test:tutorial``.
    - This will generate new screenshots in the ``docs/assets/tutorials`` directory.
#. Review the new screenshots to ensure they are accurate.
#. If the screenshots are accurate, commit them to the repository. Their paths should be consistent across runs—allowing the new versions to show up on the tutorial.

.. _testing:

Testing
-------

We use Chromatic on the Storybook to test changes to front-end components as well as to demonstrate example cases of
what those components would look like on a real project.

We use :pytest:`pytest <>` for testing the back-end manager and REST API. To run the tests, simply run ``pytest`` in
the root directory of the repository.

.. _style:

Coding Style
------------

For all JavaScript code on the frontend, we use the :prettier-code-formatter:`prettier code formatter <>` with
parameters defined in the ``prettier.config.js`` configuration file.

For all Python code on the backend, we use the :black-coding-style:`black coding style <>` with parameters defined
in the ``pyproject.toml`` configuration file.

Pre-Commit
^^^^^^^^^^

We use an automated pre-commit bot to enforce these on the main repo, but contributions from external forks would
either have to grant bot permissions on their own fork (via :pre-commit-bot:`the pre-commit bot website <>`) or
run pre-commit manually.

For instructions to install pre-commit, as well as some other minor coding styles we follow, refer to the
:neuroconv-coding-style:`NeuroConv style guide <>`.

Code signing on Mac OS
----------------------

1. Sign up for an Apple Developer account (99 USD annual fee).

2. Follow steps in https://developer.apple.com/help/account/create-certificates/create-developer-id-certificates/
    a. Browse current Certificates at https://developer.apple.com/account/resources/certificates/list.
    b. Click Certificates in the sidebar. On the top left, click the add button (+).
    c. Under Software, select Developer ID Application.
    d. Select Profile Type: G2 Sub-CA (Xcode 11.4.1 or later).
    e. Create a certificate signing request (CSR) by following the steps in https://developer.apple.com/help/account/create-certificates/create-a-certificate-signing-request
        i. Open Keychain Access.
        ii. Choose Keychain Access > Certificate Assistant > Request a Certificate from a Certificate Authority.
        iii. In the Certificate Assistant dialog, enter an email address in the User Email Address field.
        iv. In the Common Name field, enter a name for the key (for example, John Doe Dev Key). Ryan entered "Ryan Ly".
        v. Leave the CA Email Address field empty.
        vi. Choose “Saved to disk”, and click Continue.
        vii. Save the certificate request file to disk.
    f. Select the certificate request file (a file with a .certSigningRequest file extension), then click Choose.
    g. Click Continue, click Download - The certificate file (.cer file) appears in your Downloads folder.
    h. To install the certificate in your keychain, double-click the downloaded certificate file.
    i. The certificate appears in the My Certificates category in Keychain Access, but may not be trusted.
    j. For local development, download the appropriate Apple Intermediate Certificate.
    k. from https://www.apple.com/certificateauthority/ to make certificate trusted/valid.
    l. For this, it is Developer ID - G2 (Expiring 09/17/2031 00:00:00 UTC).
    m. Double-click the downloaded file.
    n. Confirm that the certificate now shows up as trusted in Keychain Access.

3. Provide a p12 file for notarizing via GitHub Action.
    a. Open Keychain Access.
    b. Select the Developer ID Application certificate.
    c. Choose Keychain Access > Export Items...
    d. Export the certificate to a file with a password.
    e. Get a base64 version of the certificate by running: base64 -i Certificate.p12 -o base64.txt
    f. Open base64.txt and copy the contents to the nwb-guide repository secret MACOS_CERTIFICATE.
    g. Set the password for the certificate in the nwb-guide repository secret MACOS_CERTIFICATE_PASSWORD.

4. Create an app-specific password for building locally and via the GitHub Action.
    a. Go to https://appleid.apple.com/account/manage.
    b. Follow the steps to create an App-Specific Password.
    c. Use that for local building and in the secrets.APPLE_PASSWORD repository secret.

5. Review and agree to any pending agreements.
    a. Go to https://appstoreconnect.apple.com/agreements/#/ and agree to pending agreements for Free Apps.
    b. Review and agree to the Apple Developer Program License Agreement, which updates periodically.

Updating the Documentation
--------------------------

The documentation is generated by :sphinx:`Sphinx <>` with the :pydata-sphinx-theme:`PyData Sphinx theme <>`.

To build the documentation locally, run:

.. code-block:: bash

    cd docs
    make html

You can also run ``make clean`` from the ``docs`` directory to remove all files in the `docs/build` directory.

The documentation is hosted online using :readthedocs:`ReadTheDocs <>`. An automation rule was set up so that
new tags will automatically be activated; however, these versions are not automatically listed in the version
switcher. ``docs/_static/switcher.json`` must be manually updated to specify new versions, remove versions
that are too old, label a particular version as stable in the name, and identify which version is
"preferred" for use in version warning banners. See
:pydata-sphinx-theme:`PyData Sphinx theme user guide <user_guide>` for instructions and more information.

Making a Release
----------------
To make a release, follow these steps:
1. Ensure that all changes are committed to the ``main`` branch.
2. Update the version number in the ``package.json`` file.
3. Add a new entry for the new version in the ``docs/_static/switcher.json`` file.
4. Make a pull request to merge these changes to the ``main`` branch.
5. Manually trigger the `build_and_deploy_mac` and `build_and_deploy_win` GitHub Actions to build the application.
   This will create a new draft release on GitHub with the updated version number and the built application files.
6. Ensure all tests and workflows pass and request a review.
7. Once the pull request is approved, merge it into the ``main`` branch.
8. Create a new tag for the release using the format "v" followed by the version number in the ``package.json`` file.
   For example, if the version number is ``1.0.0``, you would create a tag called ``v1.0.0``. Push the changes.
   You can do this using the following command:
    .. code-block:: bash

         git tag v1.0.0
         git push origin v1.0.0

9. Check the ReadTheDocs build and ensure https://nwb-guide.readthedocs.io/ points to the new version.
10. Check the install links on the main page of the documentation point to the new application files.
11. Manually trigger all tests. Ensure they pass.
12. Manually trigger the ``build_and_deploy_mac`` and ``build_and_deploy_win`` GitHub Actions to build the application.
    This will update the draft release on GitHub created in Step 5.
13. Once the builds are complete, test installing the built application files on Mac and Windows.
14. Update the changelog in the draft release and publish the release.
15. Merge the ``main`` branch into the ``linux-dev`` branch.


