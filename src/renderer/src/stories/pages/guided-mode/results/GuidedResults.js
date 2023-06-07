import { css, html } from "lit";
import { Page } from "../../Page.js";

import { get } from 'dandi'

export class GuidedResultsPage extends Page {
    constructor(...args) {
        super(...args);
    }

    async updated() {

        const handleId = (str, info) => {

            let value = info[str]
            if (str === 'modified') value = (new Date(value)).toString()

            const el = this.query(`#${str}`)
            el.innerText = value

            if (el.tagName === 'A') {
                if (str === 'doi') value = `http://doi.org/${value}`
                el.href = value
                el.target = '__blank'
            }
        }

        const { dandiset_id, staging } = this.info.globalState.upload.info

        const elIds = ['name', 'modified', 'status', 'version']
        const dandiset = await get(dandiset_id, staging ? 'staging' : undefined)
        elIds.forEach(str => handleId(str, dandiset.draft_version))

        const info = await dandiset.getInfo({ version: dandiset.draft_version.version })

        const secondElIds = ['description', 'url', 'doi', 'citation']
        secondElIds.forEach(str => handleId(str, info))

    }

    render() {
        const { dandiset_id, } = this.info.globalState.upload.info

        const results = this.info.globalState.conversion

        if (!results) return html`<div style="text-align: center;"><p>Your conversion failed. Please try again.</p></div>`

        return html`
            <div style="text-align: center;">
                <div style="display: inline-block; width: 100%; max-width: 500px;text-align: left;">
                    <h2 style="margin: 0;"><span id="name"></span></h2>
                    <p><span id="description"></span></p>

                    <p><b>Identifier:</b> ${dandiset_id}</p>
                    <p><b>Version:</b> <span id="version"></span></p>
                    <p><b>Upload Time:</b> <span id="modified"></span></p>
                    <p><b>Status:</b> <span id="status"></span></p>

                    <small><b>URL:</b> <a id="url"></a></small><br/>
                    <small><b>DOI:</b> <a id="doi"></a></small>

                    <h3 style="padding: 0;">Citation</h3>
                    <hr>

                    <span id="citation"></span>

                    <h3 style="padding: 0;">Files Uploaded with this Conversion</h3>
                    <hr>
                    <ol>
                        ${results.map(o => html`<li>${o.file}</li>`)}
                    </ol>
                </div>
            </div>
        `;
    }
}

customElements.get("nwbguide-guided-results-page") ||
    customElements.define("nwbguide-guided-results-page", GuidedResultsPage);
