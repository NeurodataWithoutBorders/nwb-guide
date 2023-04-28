Developer Guide
===============

We welcome contributions from the community! If you are interested in contributing, please read the following guide to get started.

Starting a New Feature
---------------------------

1. Create a new branch off of the ``main`` branch. The branch name should be descriptive of the feature you are working on.

.. hint::
    For example, if you are working on a feature to add a new page, you could name the branch ``add-new-metadata-page``.

2. Make your changes on the new branch.

.. important::
    When you are ready to commit, make sure to run ``pre-commit run --all-files`` to ensure that your code is formatted correctly. If you are adding new code, make sure to add :ref:`tests <testing>` for it as well.

1. Push your changes to the remote branch. Then, open a pull request to merge your branch into the ``main`` branch.

.. tip::
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

            console.log(this.info.globalState) // This will print the global state that is currently being passed between subpages (i.e. within guided mode)
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


.. _testing:
Testing
---------------------------

We use :pytest:`pytest <>` for testing. To run the tests, simply run ``pytest`` in the root directory of the repository.

.. _style:
Coding Style
---------------------------

For all Python code on the backend, we use the :black-coding-style:`black coding style <>` with parameters defined in the ``pyproject.toml`` configuration file.

For all JavaScript code on the frontend, we use the :prettier-code-formatter:`prettier code formatter <>` with parameters defined in the ``prettier.config.js`` configuration file.

Pre-Commit
^^^^^^^^^^^^^^^^^^^^^^^^^^

We use an automated pre-commit bot to enforce these on the main repo, but contributions from external forks would either have to grant bot permissions on their own fork (via :pre-commit-bot:`the pre-commit bot website <>`) or run pre-commit manually.

For instructions to install pre-commit, as well as some other minor coding styles we follow, refer to the :neuroconv-coding-style:`NeuroConv style guide <>`.
