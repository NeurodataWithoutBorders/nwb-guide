import { html } from "lit";
import { Page } from "../../Page.js";

// For Multi-Select Form
import { Button } from "../../../Button.js";
import { supportedInterfaces } from "../../../../globals.js";
import { Search } from "../../../Search.js";
import { Modal } from "../../../Modal";
import { List } from "../../../List";
import { baseUrl } from "../../../../server/globals";

const defaultEmptyMessage = "No formats selected";

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
        this.search.onSelect = (item) => {
            this.list.add(item);
            this.searchModal.toggle(false);
        };

        Object.assign(this.addButton.style, {
            marginTop: '10px'
        })
        
        this.addButton.innerText = "Add Format";
        this.addButton.onClick = () => {
            this.search.shadowRoot.querySelector("input").focus();
            this.searchModal.toggle(true);
        };

        this.searchModal.appendChild(this.search);
    }

    header = {
        subtitle: "List all the data formats in your dataset.",
    };

    search = new Search({
        disabledLabel: "Not supported",
        headerStyles: {
            padding: "15px",
        },
    });

    list = new List({ emptyMessage: defaultEmptyMessage });

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
        const interfaces = (this.info.globalState.interfaces = { ...this.list.object });

        // Remove or reassign extra interfaces in results
        if (this.info.globalState.results) {
            this.mapSessions(({ info }) => {
                const metadata = [info.source_data];
                metadata.forEach((results) => {
                    Object.keys(results).forEach((key) => {
                        if (!interfaces[key]) {
                            const renamed = this.list.items.find((item) => item.originalKey === key);
                            if (renamed) results[renamed.key] = results[key];
                            delete results[key];
                        }
                    });
                });
            });
        }

        await this.save(undefined, false); // Interim save, in case the schema request fails
        await this.getSchema();
    };

    footer = {
        onNext: async () => {
            if (!this.info.globalState.schema) await this.getSchema(); // Initialize schema
            return this.to(1);
        },
    };

    async updated() {
        const { interfaces = {} } = this.info.globalState;

        this.list.emptyMessage = "Loading valid formats...";

        this.search.options = await fetch(`${baseUrl}/neuroconv`)
            .then((res) => res.json())
            .then((json) =>
                Object.entries(json).map(([key, value]) => {
                    const displayName = key.trim();

                    const interfaceName = value.name;

                    const category = categories.find(({ test }) => test.test(interfaceName))?.value;

                    const structuredKeywords = {
                        suffixes: value.suffixes ?? [],
                    };

                    return {
                        ...value, // Contains label and name already (extra metadata)
                        key: displayName,
                        value: interfaceName,
                        structuredKeywords,
                        category,
                        disabled: !supportedInterfaces.includes(interfaceName),
                    };
                })
            )
            .catch((error) => console.error(error));

        this.list.emptyMessage = defaultEmptyMessage;

        const items = [];

        for (const [key, name] of Object.entries(interfaces)) {
            let found = this.search.options?.find((item) => item.value === name);

            // If not found, spoof based on the key and names provided previously
            if (!found) {
                found = {
                    key,
                    label: name.replace("Interface", ""),
                    value: name,
                };
            }

            items.push({ ...found, key });
        }

        const ogList = this.list;

        this.list = new List({
            items,
            emptyMessage: defaultEmptyMessage,
            onChange: () => (this.unsavedUpdates = "conversions"),
        });

        this.list.style.display = "inline-block";

        ogList.replaceWith(this.list);

        this.addButton.removeAttribute("hidden");
        super.updated(); // Call if updating data
    }

    render() {
        // Reset list
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
