import { html } from "lit";
import { Page } from "../../Page.js";

// For Multi-Select Form
import { Button } from "../../../Button.js";
import { baseUrl, supportedInterfaces } from "../../../../globals.js";
import { Search } from "../../../Search.js";
import { Modal } from "../../../Modal";
import { List } from "../../../List";

const defaultEmptyMessage = "No interfaces selected";

const categories = [
    {
        test: /.*Interface.*/,
        value: "Single-Stream Interfaces",
    },
    {
        test: /.*Converter.*/,
        value: "Multi-Stream Converters",
    },
];

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

    header = {
        subtitle: "Select all interfaces which apply to this experiment",
    };

    search = new Search({
        disabledLabel: "Not supported",
        headerStyles: {
            padding: '15px'
        }
    });

    list = new List({
        emptyMessage: defaultEmptyMessage,
        onChange: () => (this.unsavedUpdates = "conversions"),
    });

    addButton = new Button();

    searchModal = new Modal({
        width: "100%",
        height: "100%",
    });

    getSchema = async () => {
        const interfaces = { ...this.list.object };

        const schema =
            Object.keys(interfaces).length === 0
                ? {}
                : await fetch(`${baseUrl}/neuroconv/schema`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(interfaces),
                  }).then((res) => res.json());

        let schemas = this.info.globalState.schema;
        if (!schemas) schemas = this.info.globalState.schema = {};

        schemas.source_data = schema;
        this.unsavedUpdates = true;
    };

    beforeSave = async () => {
        this.info.globalState.interfaces = { ...this.list.object };

        // Remove extra interfaces from results
        if (this.info.globalState.results) {
            this.mapSessions(({ info }) => {
                Object.keys(info.source_data).forEach((key) => {
                    if (!this.info.globalState.interfaces[key]) delete info.source_data[key];
                });
            });
        }

        await this.save(undefined, false); // Interrim save, in case the schema request fails
        await this.getSchema();
    };

    footer = {
        onNext: async () => {
            if (!this.info.globalState.schema) await this.getSchema(); // Initialize schema
            this.to(1);
        },
    };

    async updated() {
        const { interfaces = {} } = this.info.globalState;

        this.list.emptyMessage = "Loading valid interfaces...";

        this.search.options = await fetch(`${baseUrl}/neuroconv`)
            .then((res) => res.json())
            .then((json) =>
                Object.entries(json).map(([key, value]) => {
                    const category = categories.find(({ test }) => test.test(key))?.value;

                    return {
                        ...value,
                        key,
                        value: key,
                        category,
                        disabled: !supportedInterfaces.includes(key),
                    }; // Has label and keywords property already
                })
            )
            .catch((e) => console.error(e));

        this.list.emptyMessage = defaultEmptyMessage;

        for (const [key, name] of Object.entries(interfaces)) {
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

        this.addButton.removeAttribute("hidden");
        super.updated(); // Call if updating data
    }

    render() {
        // Reset list
        this.list.style.display = "inline-block";
        this.list.clear();
        this.addButton.setAttribute("hidden", "");

        return html`
            <div style="width: 100%; display: flex; flex-direction: column; align-items: center;">
                ${this.list} ${this.addButton}
            </div>
            ${this.searchModal}
        `;
    }
}

customElements.get("nwbguide-guided-structure-page") ||
    customElements.define("nwbguide-guided-structure-page", GuidedStructurePage);
