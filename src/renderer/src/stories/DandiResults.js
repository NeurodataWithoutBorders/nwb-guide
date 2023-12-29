import { LitElement, css, html } from "lit";

import { get } from "dandi";
import { isStaging } from "./pages/uploads/utils";

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
        const handleClass = (str, info) => {
            let value = info[str];
            if (str === "modified") value = new Date(value).toString();

            const els = this.shadowRoot.querySelectorAll(`.${str}`);
            els.forEach((el) => {
                el.innerText = value;

                if (el.tagName === "A") {
                    if (str === "doi") value = `http://doi.org/${value}`;
                    el.href = value;
                    el.target = "_blank";
                }
            });
        };

        const elIds = ["name", "modified"];

        const otherElIds = ["embargo_status"];

        const type = isStaging(this.id) ? "staging" : undefined;
        const dandiset = await get(this.id, { type });

        otherElIds.forEach((str) => handleClass(str, dandiset));
        elIds.forEach((str) => handleClass(str, dandiset.draft_version));

        const latestVersionInfo = dandiset.most_recent_published_version ?? dandiset.draft_version;
        const info = await dandiset.getInfo({ type, version: latestVersionInfo.version });

        const secondElIds = ["description", "url"];
        secondElIds.forEach((str) => handleClass(str, info));

        const publicationEl = this.shadowRoot.querySelector(`.publication`);
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
                    <h2 style="margin: 0; margin-bottom: 10px;"><span class="name"></span></h2>
                    <p><span class="description"></span></p>

                    <p><b>Identifier:</b> ${this.id}</p>
                    <p><b>Upload Time:</b> <span class="modified"></span></p>
                    <p><b>Embargo Status:</b> <span class="embargo_status"></span></p>

                    <small><b>URL:</b> <a class="url"></a></small><br />

                    <h3 style="padding: 0;">Related Publications</h3>
                    <ol class="publication"></ol>

                    ${this.files
                        ? html` <h3 style="padding: 0;">Files Uploaded</h3>
                              <ol>
                                  ${Object.values(this.files)
                                      .map((v) => Object.values(v))
                                      .flat()
                                      .map((o) => html`<li>${o.file}</li>`)}
                              </ol>`
                        : ""}
                    <hr />
                    <small>We encourage you to add additional metadata for your Dandiset at <a class="url"></a></small>
                </div>
            </div>
        `;
    }
}

customElements.get("dandi-results") || customElements.define("dandi-results", DandiResults);
