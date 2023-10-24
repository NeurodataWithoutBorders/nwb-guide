Developer Guide
===============

We welcome contributions from the community! If you are interested in contributing, please read the following guide to get started.

Starting a New Feature
---------------------------

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
^^^^^^^^^^^^^^^^^^^^^^^^^^

New pages can be added by linking a component in the ``src/pages.js`` file. For example, if you wanted to add a new page called ``NewPage``, you would add the following to the configuration file:

.. code-block:: javascript

    import NewPage from "./stories/pages/NewPage";

    // ...

    const pages = {

        // ...

        'guided': new GuidedHomePage({
            label: "Guided Mode",
            icon: guidedIcon,
            pages: {
                start: new GuidedStartPage({
                    label: "Start",
                }),

                // ...

                newpage: new NewPage({
                    label: "New Page", // This is the label that will be displayed in the sidebar
                }),

                // ...

            },
        })

        // ...

        }

    // ...

This will automatically add the new page to the sidebar. The page itself can be defined in the ``src/stories/pages/NewPage.js`` file. For example, if you wanted to add a new page that displays a simple message, you could add the following to the ``src/stories/pages/NewPage.js`` file:


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

Extending the ``Page`` class rather than the ``LitElement`` class provides each page with standard properties and methods that allow for uniform handling across the application.


Discover Existing Components
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

While developing NWB GUIDE, you may find that you need to use a component that already exists in the codebase. To find a component, you can manually peruse the ``src/stories`` directory or run the project's Storybook instance to see all of the components in action.

To run Storybook, simply run ``npm run storybook`` in the root directory of the repository. This will start a local server that you can access using the link provided on the command line.

To see if someone else has developed a third-party component to fit your needs, you can refer to :web-components:`WebComponents.org <>` and search based on your particular needs. :npm:`NPM` may also be useful to search for third-party packages (e.g. Handsontable) that implement the feature you need.


.. _testing:

Testing
---------------------------

We use Chromatic on the Storybook to test changes to front-end components as well as to demonstrate example cases of what those components would look like on a real project.

We use :pytest:`pytest <>` for testing the back-end manager and REST API. To run the tests, simply run ``pytest`` in the root directory of the repository.

.. _style:

Coding Style
---------------------------

For all JavaScript code on the frontend, we use the :prettier-code-formatter:`prettier code formatter <>` with parameters defined in the ``prettier.config.js`` configuration file.

For all Python code on the backend, we use the :black-coding-style:`black coding style <>` with parameters defined in the ``pyproject.toml`` configuration file.

Pre-Commit
^^^^^^^^^^^^^^^^^^^^^^^^^^

We use an automated pre-commit bot to enforce these on the main repo, but contributions from external forks would either have to grant bot permissions on their own fork (via :pre-commit-bot:`the pre-commit bot website <>`) or run pre-commit manually.

For instructions to install pre-commit, as well as some other minor coding styles we follow, refer to the :neuroconv-coding-style:`NeuroConv style guide <>`.

Code signing on Mac OS
---------------------------

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
