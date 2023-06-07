import { html } from "lit";
import { Page } from "../../Page.js";

// For Multi-Select Form
import { Button } from "../../../Button.js";
import { baseUrl, supportedInterfaces } from "../../../../globals.js";
import { Search } from "../../../Search.js";
import { Modal } from "../../../Modal";

export class GuidedStructurePage extends Page {
    constructor(...args) {
        super(...args);

        // Handle Search Bar Interactions
        this.search.list.style.position = "unset";
        this.search.onSelect = (...args) => {
            this.#addListItem(...args);
            this.searchModal.toggle(false);
        };

        this.addButton.innerText = "Add Interface";
        this.addButton.onClick = () => {
            this.searchModal.toggle(true);
        };

        this.searchModal.appendChild(this.search);
    }

    #selected = {};

    #addListItem = (listValue) => {
        const { key, label, value } = listValue;
        const li = document.createElement("li");
        const keyEl = document.createElement("span");

        let resolvedKey = key;
        const originalValue = resolvedKey;

        // Ensure no duplicate keys
        let i = 0;
        while (resolvedKey in this.#selected) {
            i++;
            resolvedKey = `${originalValue}_${i}`;
        }

        keyEl.innerText = resolvedKey;
        keyEl.contentEditable = true;
        keyEl.style.cursor = "text";

        li.style.display = "flex";
        li.style.alignItems = "center";

        li.appendChild(keyEl);

        const sepEl = document.createElement("span");
        sepEl.innerHTML = "&nbsp;-&nbsp;";
        li.appendChild(sepEl);

        const valueEl = document.createElement("span");
        valueEl.innerText = label;
        li.appendChild(valueEl);
        this.list.appendChild(li);

        const button = new Button({
            label: "Delete",
            size: "small",
        });

        button.style.marginLeft = "1rem";

        li.appendChild(button);

        this.#selected[resolvedKey] = value;

        // Stop enter key from creating new line
        keyEl.addEventListener("keydown", function (e) {
            if (e.keyCode === 13) {
                keyEl.blur();
                return false;
            }
        });

        const deleteListItem = () => {
            li.remove();
            delete this.#selected[resolvedKey];
        };

        keyEl.addEventListener("blur", () => {
            const newKey = keyEl.innerText;
            if (newKey === "") keyEl.innerText = resolvedKey; // Reset to original value
            else {
                delete this.#selected[resolvedKey];
                resolvedKey = newKey;
                this.#selected[resolvedKey] = value;
            }
        });

        button.onClick = deleteListItem;
    };

    search = new Search({
        showAllWhenEmpty: true,
    });

    list = document.createElement("ul");

    addButton = new Button();

    searchModal = new Modal();

    footer = {
        onNext: async () => {
            this.save(); // Save in case the schema request fails

            const interfaces = { ...this.#selected };

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

            this.#addListItem({ ...found, key }); // Add previously selected items
        }
    }

    render() {
        // Reset list
        this.#selected = {};
        this.list.remove();
        this.list = document.createElement("ul");
        this.list.style.display = "inline-block";
        this.addButton.style.display = "block";

        return html`
            <div style="width: 100%; text-align: center;">${this.list} ${this.addButton}</div>
            ${this.searchModal}
        `;
    }
}

customElements.get("nwbguide-guided-structure-page") ||
    customElements.define("nwbguide-guided-structure-page", GuidedStructurePage);
