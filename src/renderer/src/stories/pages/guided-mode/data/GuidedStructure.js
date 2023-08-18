import { html } from "lit";
import { Page } from "../../Page.js";

// For Multi-Select Form
import { Button } from "../../../Button.js";
import { baseUrl, supportedInterfaces } from "../../../../globals.js";
import { Search } from "../../../Search.js";
import { Modal } from "../../../Modal";
import { List } from "../../../List";

export class GuidedStructurePage extends Page {
    constructor(...args) {
        super(...args);

        // Handle Search Bar Interactions
        this.search.list.style.position = "unset";
        this.search.onSelect = (...args) => {
            this.list.add(...args);
            this.searchModal.toggle(false);
        };

        this.addButton.innerText = "Add Interface";
        this.addButton.onClick = () => {
            this.searchModal.toggle(true);
        };

        this.searchModal.appendChild(this.search);
    }

    search = new Search({
        showAllWhenEmpty: true,
    });

    list = new List({
        emptyMessage: 'No interfaces selected'
    });

    addButton = new Button();

    searchModal = new Modal({
        width: "100%",
        height: "100%",
    });

    footer = {
        onNext: async () => {
            this.save(); // Save in case the schema request fails

            const interfaces = { ...this.list.object };

            // if (Object.keys(interfaces).length === 0) throw new Error('No interfaces selected.')

            const schema = await fetch(`${baseUrl}/neuroconv/schema`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(interfaces),
            }).then((res) => res.json())

            let schemas = this.info.globalState.schema;
            if (!schemas) schemas = this.info.globalState.schema = {};

            schemas.source_data = schema;
            this.info.globalState.interfaces = interfaces;

            this.onTransition(1);
        },
    };

    async updated() {
        const selected = this.info.globalState.interfaces;

        this.search.options = await fetch(`${baseUrl}/neuroconv`)
            .then((res) => res.json())
            .then((json) =>
                Object.entries(json).map(([key, value]) => {
                    return {
                        ...value,
                        key: key.replace("Interface", ""),
                        value: key,
                        disabled: !supportedInterfaces.includes(key),
                    }; // Has label and keywords property already
                })
            )
            .catch((e) => console.error(e));

        for (const [key, name] of Object.entries(selected || {})) {
            let found = this.search.options?.find((o) => o.value === name);

            // If not found, spoof based on the key and names provided previously
            if (!found) {
                found = {
                    key,
                    label: name.replace("Interface", ""),
                    value: name,
                };
            }

            this.list.add({ ...found, key }); // Add previously selected items
        }
    }

    render() {
        // Reset list
        this.list.style.display = "inline-block";
        this.list.clear();
        this.addButton.style.display = "block";

        return html`
            <div style="width: 100%; text-align: center;">${this.list} ${this.addButton}</div>
            ${this.searchModal}
        `;
    }
}

customElements.get("nwbguide-guided-structure-page") ||
    customElements.define("nwbguide-guided-structure-page", GuidedStructurePage);
