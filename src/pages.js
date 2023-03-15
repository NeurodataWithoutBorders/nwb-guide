import { GettingStartedPage } from "./stories/pages/getting-started/GettingStarted"
import { DocumentationPage } from "./stories/pages/documentation/Documentation"
import { ContactPage } from "./stories/pages/contact-us/Contact"
import { GuidedHomePage } from "./stories/pages/guided-mode/GuidedHome"
import { GuidedStartPage } from "./stories/pages/guided-mode/GuidedStart"
import { GuidedNewDatasetPage } from "./stories/pages/guided-mode/GuidedNewDatasetInfo"

const dashboard = document.querySelector('nwb-dashboard')

const overviewIcon = `
<svg
    style="margin-right: 30px; margin-bottom: -5px"
    width="20px"
    height="20px"
    viewBox="0 0 16 16"
    class="bi bi-caret-right-square-fill"
    fill="white"
    xmlns="http://www.w3.org/2000/svg"
>
<path
    fill-rule="evenodd"
    d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm5.5 10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0 0-.748l-4.5-4A.5.5 0 0 0 5.5 4v8z"
></path>
</svg>
`

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
`

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
`

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
`

dashboard.pages = {
    'Overview': {
        id: "/",
        page: new GettingStartedPage(),
        icon: overviewIcon
    },
    'Guided Mode': {
        id: "guided",
        page: [
            {
                id: 'home',
                page: new GuidedHomePage()
            },
            {
                id: 'start',
                page: new GuidedStartPage(),
            }, 
            {
                id: 'new-dataset',
                page: new GuidedNewDatasetPage()
            }
        ],
        icon: guidedIcon
    },
    'Documentation': {
        page: new DocumentationPage(),
        icon: documentationIcon
    },
    "Contact Us": {
        page: new ContactPage(),
        icon: contactIcon
    },
}