import { GettingStartedPage } from "./stories/pages/getting-started/GettingStarted";
import { DocumentationPage } from "./stories/pages/documentation/Documentation";
import { ContactPage } from "./stories/pages/contact-us/Contact";
import { GuidedHomePage } from "./stories/pages/guided-mode/GuidedHome";
import { GuidedNewDatasetPage } from "./stories/pages/guided-mode/setup/GuidedNewDatasetInfo";
import { GuidedStructurePage } from "./stories/pages/guided-mode/data/GuidedStructure";
import { sections } from "./stories/pages/globals";
import { GuidedSubjectsPage } from "./stories/pages/guided-mode/setup/GuidedSubjects";
import { GuidedSourceDataPage } from "./stories/pages/guided-mode/data/GuidedSourceData";
import { GuidedMetadataPage } from "./stories/pages/guided-mode/data/GuidedMetadata";
import { GuidedUploadPage } from "./stories/pages/guided-mode/options/GuidedUpload";
import { GuidedResultsPage } from "./stories/pages/guided-mode/results/GuidedResults";
import { Dashboard } from "./stories/Dashboard";
import { GuidedStubPreviewPage } from "./stories/pages/guided-mode/options/GuidedStubPreview";
import { GuidedInspectorPage } from "./stories/pages/guided-mode/options/GuidedInspectorPage";

import logo from "../assets/img/logo-guide-draft-transparent-tight.png";
import { GuidedPathExpansionPage } from "./stories/pages/guided-mode/data/GuidedPathExpansion";
import uploadIcon from "../assets/icons/dandi.svg";
import inspectIcon from "../assets/icons/inspect.svg?raw";
import neurosiftIcon from "../assets/icons/neurosift-logo.svg?raw";

import settingsIcon from "../assets/icons/settings.svg?raw";

import { UploadsPage } from "./stories/pages/uploads/UploadsPage";
import { SettingsPage } from "./stories/pages/settings/SettingsPage";
import { InspectPage } from "./stories/pages/inspect/InspectPage";
import { PreviewPage } from "./stories/pages/preview/PreviewPage";
import { GuidedPreform } from "./stories/pages/guided-mode/setup/Preform";
import { GuidedDandiResultsPage } from "./stories/pages/guided-mode/results/GuidedDandiResults";

let dashboard = document.querySelector("nwb-dashboard");
if (!dashboard) dashboard = new Dashboard();
dashboard.logo = logo;
dashboard.name = "NWB GUIDE";
dashboard.renderNameInSidebar = false;

const resourcesGroup = "Resources";

const guidedIcon = `
<svg
    xmlns="http://www.w3.org/2000/svg"
    width="20px"
    height="20px"
    fill="white"
    class="bi bi-compass-fill"
    viewBox="0 0 16 16"
    style="margin-right: 30px; margin-bottom: -5px"
>
<path
    d="M8 16.016a7.5 7.5 0 0 0 1.962-14.74A1 1 0 0 0 9 0H7a1 1 0 0 0-.962 1.276A7.5 7.5 0 0 0 8 16.016zm6.5-7.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"
></path>
<path d="M6.94 7.44l4.95-2.83-2.83 4.95-4.949 2.83 2.828-4.95z"></path>
</svg>
`;

const documentationIcon = `
<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 448 512"
    height="20px"
    width="20px"
    style="margin-right: 30px; margin-bottom: -5px"
>
<path
  d="M448 336v-288C448 21.49 426.5 0 400 0H96C42.98 0 0 42.98 0 96v320c0 53.02 42.98 96 96 96h320c17.67 0 32-14.33 32-31.1c0-11.72-6.607-21.52-16-27.1v-81.36C441.8 362.8 448 350.2 448 336zM143.1 128h192C344.8 128 352 135.2 352 144C352 152.8 344.8 160 336 160H143.1C135.2 160 128 152.8 128 144C128 135.2 135.2 128 143.1 128zM143.1 192h192C344.8 192 352 199.2 352 208C352 216.8 344.8 224 336 224H143.1C135.2 224 128 216.8 128 208C128 199.2 135.2 192 143.1 192zM384 448H96c-17.67 0-32-14.33-32-32c0-17.67 14.33-32 32-32h288V448z"
></path></svg>
`;

const contactIcon = `
<svg
xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 512 512"
height="20px"
width="20px"
style="margin-right: 30px; margin-bottom: -5px"
>                  <path
  d="M511.1 63.1v287.1c0 35.25-28.75 63.1-64 63.1h-144l-124.9 93.68c-7.875 5.75-19.12 .0497-19.12-9.7v-83.98h-96c-35.25 0-64-28.75-64-63.1V63.1c0-35.25 28.75-63.1 64-63.1h384C483.2 0 511.1 28.75 511.1 63.1z"
></path></svg>
`;

const pages = {
    "/": new GuidedHomePage({
        label: "Convert",
        icon: guidedIcon,
        pages: {
            details: new GuidedNewDatasetPage({
                title: "Project Setup",
                label: "Project details",
                section: sections[0],
            }),

            workflow: new GuidedPreform({
                title: "Pipeline Workflow",
                label: "Pipeline workflow",
                section: sections[0],
            }),

            structure: new GuidedStructurePage({
                title: "Provide Data Formats",
                label: "Data formats",
                section: sections[0],
            }),

            locate: new GuidedPathExpansionPage({
                title: "Locate Data",
                label: "Locate data",
                section: sections[0],
            }),

            subjects: new GuidedSubjectsPage({
                title: "Subject Metadata",
                label: "Subject details",
                section: sections[0],
            }),

            sourcedata: new GuidedSourceDataPage({
                title: "Source Data Information",
                label: "Source data",
                section: sections[1],
            }),

            metadata: new GuidedMetadataPage({
                title: "File Metadata",
                label: "File metadata",
                section: sections[1],
            }),

            inspect: new GuidedInspectorPage({
                title: "Inspector Report",
                label: "Validate metadata",
                section: sections[2],
                sync: ["preview"],
            }),

            preview: new GuidedStubPreviewPage({
                title: "Conversion Preview",
                label: "Preview NWB files",
                section: sections[2],
                sync: ["preview"],
            }),

            conversion: new GuidedResultsPage({
                title: "Conversion Review",
                label: "Review conversion",
                section: sections[2],
                sync: ["conversion"],
            }),

            upload: new GuidedUploadPage({
                title: "DANDI Upload",
                label: "Upload to DANDI",
                section: sections[3],
                sync: ["conversion"],
            }),

            review: new GuidedDandiResultsPage({
                title: "Upload Review",
                label: "Review published data",
                section: sections[3],
            }),
        },
    }),
    validate: new InspectPage({
        label: "Validate",
        icon: inspectIcon,
    }),
    explore: new PreviewPage({
        label: "Explore",
        icon: neurosiftIcon,
    }),
    uploads: new UploadsPage({
        label: "Upload",
        icon: uploadIcon,
    }),
    docs: new DocumentationPage({
        label: "Documentation",
        icon: documentationIcon,
        group: resourcesGroup,
    }),
    contact: new ContactPage({
        label: "Contact Us",
        icon: contactIcon,
        group: resourcesGroup,
    }),
    settings: new SettingsPage({
        label: "Settings",
        icon: settingsIcon,
        group: "bottom",
    }),
};

dashboard.pages = pages;

export { dashboard };
