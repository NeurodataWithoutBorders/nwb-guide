import { LitElement, css, html } from "lit";

import { get } from "dandi";
import { isStaging } from "./pages/uploads/UploadsPage.js";

export class DandiResults extends LitElement {
    static get styles() {
        return css`
            :host {
                display: block;
            }
        `;
    }

    constructor(props) {
        super();
        Object.assign(this, props);
    }

    async updated() {
        const handleId = (str, info) => {
            let value = info[str];
            if (str === "modified") value = new Date(value).toString();

            const el = this.shadowRoot.querySelector(`#${str}`);
            el.innerText = value;

            if (el.tagName === "A") {
                if (str === "doi") value = `http://doi.org/${value}`;
                el.href = value;
                el.target = "_blank";
            }
        };

        const elIds = ["name", "modified"];

        const otherElIds = ["embargo_status"];

        const dandiset = await get(this.id, isStaging(this.id) ? "staging" : undefined);

        otherElIds.forEach((str) => handleId(str, dandiset));
        elIds.forEach((str) => handleId(str, dandiset.draft_version));

        const info = await dandiset.getInfo({ version: dandiset.draft_version.version });

        const secondElIds = ["description", "url"];
        secondElIds.forEach((str) => handleId(str, info));

        const publicationEl = this.shadowRoot.querySelector(`#publication`);
        publicationEl.innerHTML = "";
        const publications = (info.relatedResource ?? []).filter((o) => o.relation === "dcite:IsDescribedBy");

        if (publications.length)
            publicationEl.append(
                ...(await Promise.all(
                    publications.map(async (o) => {
                        const li = document.createElement("li");
                        const { message } = await fetch(
                            `http://api.crossref.org/works${new URL(o.identifier).pathname}`
                        ).then((res) => res.json());
                        li.innerHTML = `${message.author.map((o) => `${o.family}, ${o.given[0]}.`).join(", ")} (${
                            message.created["date-parts"][0][0]
                        }). ${message.title[0]}. <i>${message["container-title"]}</i>, <i>${message.volume}</i>(${
                            message.issue
                        }), ${message.page}. doi:${message.DOI}`;
                        return li;
                    })
                ))
            );
        else publicationEl.innerText = "N/A";
    }

    render() {
        return html`
            <div style="text-align: center;">
                <div style="display: inline-block; width: 100%; text-align: left;">
                    <h2 style="margin: 0; margin-bottom: 10px;"><span id="name"></span></h2>
                    <p><span id="description"></span></p>

                    <p><b>Identifier:</b> ${this.id}</p>
                    <p><b>Upload Time:</b> <span id="modified"></span></p>
                    <p><b>Embargo Status:</b> <span id="embargo_status"></span></p>

                    <small><b>URL:</b> <a id="url"></a></small><br />

                    <h3 style="padding: 0;">Related Publications</h3>
                    <hr />
                    <ol id="publication"></ol>

                    ${this.files
                        ? html` <h3 style="padding: 0;">Files Uploaded with this Conversion</h3>
                              <hr />
                              <ol>
                                  ${Object.values(this.files)
                                      .map((v) => Object.values(v))
                                      .flat()
                                      .map((o) => html`<li>${o.file}</li>`)}
                              </ol>`
                        : ""}
                </div>
            </div>
        `;
    }
}

customElements.get("dandi-results") || customElements.define("dandi-results", DandiResults);
