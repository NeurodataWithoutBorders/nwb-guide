import { html } from "lit";
import { Page } from "../../Page.js";

import { DandiResults } from "../../../DandiResults.js";

export class GuidedResultsPage extends Page {
    constructor(...args) {
        super(...args);
    }

    render() {
        const { conversion } = this.info.globalState;

        if (!conversion)
            return html`<div style="text-align: center;"><p>Your conversion failed. Please try again.</p></div>`;

        const { dandiset_id } = this.info.globalState.upload?.info ?? {};

        return html`<div style="padding: 10px 20px;">${new DandiResults({ id: dandiset_id, files: conversion })}</div>`
    }
}

customElements.get("nwbguide-guided-results-page") ||
    customElements.define("nwbguide-guided-results-page", GuidedResultsPage);
