import { html } from "lit";
import { Page } from "../../Page.js";

import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import folderOpenSVG from "../../../assets/folder_open.svg?raw";

import { electron } from "../../../../electron/index.js";
import { Neurosift, getURLFromFilePath } from "../../../Neurosift.js";
import { InstanceManager } from "../../../InstanceManager.js";

const { shell } = electron;

export class GuidedStubPreviewPage extends Page {
    constructor(...args) {
        super(...args);
    }

    header = {
        subtitle: () => this.info.globalState.stubs[0],
        controls: () =>
            html`<nwb-button
                size="small"
                @click=${() => (shell ? shell.showItemInFolder(this.info.globalState.stubs[0]) : "")}
                >${unsafeSVG(folderOpenSVG)}</nwb-button
            >`,
    };

    // NOTE: We may want to trigger this whenever (1) this page is visited AND (2) data has been changed.
    footer = {
        next: "Run Conversion",
        onNext: async () => {
            await this.save(); // Save in case the conversion fails
            delete this.info.globalState.conversion;
            this.info.globalState.conversion = await this.runConversions({}, true, {
                title: "Running all conversions",
            });
            this.to(1);
        },
    };

    createInstance = ({ subject, session, info }) => {
        const { project, stubs } = this.info.globalState;

        return {
            subject,
            session,
            display: new Neurosift({ url: getURLFromFilePath(stubs[subject][session], project.name) }),
        };
    };

    render() {
        const { stubs } = this.info.globalState;

        const _instances = this.mapSessions(this.createInstance);

        const instances = _instances.reduce((acc, { subject, session, display }) => {
            if (!acc[`sub-${subject}`]) acc[`sub-${subject}`] = {};
            acc[`sub-${subject}`][`ses-${session}`] = display;
            return acc;
        }, {});

        return stubs
            ? (this.manager = new InstanceManager({
                  header: "Sessions",
                  instanceType: "Session",
                  instances,
              }))
            : html`<p style="text-align: center;">Your conversion preview failed. Please try again.</p>`;
    }
}

customElements.get("nwbguide-guided-stub-review-page") ||
    customElements.define("nwbguide-guided-stub-review-page", GuidedStubPreviewPage);
