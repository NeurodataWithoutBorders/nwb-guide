import { LitElement, html, css } from "lit";
import { styleMap } from "lit/directives/style-map.js";

import searchSVG from "./assets/search.svg?raw";

import tippy from "tippy.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

export class Search extends LitElement {
    constructor({
        value,
        options,
        showAllWhenEmpty = true,
        listMode = "list",
        headerStyles = {},
        disabledLabel,
        onSelect,
    } = {}) {
        super();
        this.#value = value;
        this.options = options;
        this.showAllWhenEmpty = showAllWhenEmpty;
        this.disabledLabel = disabledLabel;
        this.listMode = listMode;
        this.headerStyles = headerStyles;
        if (onSelect) this.onSelect = onSelect;

        document.addEventListener("click", () => this.submit());
    }

    submit = () => {
        if (this.listMode === "click" && this.getAttribute("interacted") === "true") {
            this.setAttribute("interacted", false);
            this.#onSelect(this.getSelectedOption());
        }
    };

    #value;

    #isObject(value = this.#value) {
        return value && typeof value === "object";
    }

    getSelectedOption = () => {
        const value = (this.shadowRoot.querySelector("input") ?? this).value;
        const matched = this.options.find((item) => item.label === value);
        return matched ?? { value };
    };

    get value() {
        return this.#isObject() ? this.#value.value : this.#value;
    }

    set value(val) {
        this.#value = val;
        this.requestUpdate();
    }

    static get styles() {
        return css`
            * {
                box-sizing: border-box;
            }

            :host {
                position: relative;
                display: flex;
                flex-direction: column;
                background: white;
                border-radius: 5px;
                width: 100%;
                height: 100%;
            }

            .header {
                background: white;
                position: relative;
            }

            input {
                width: 100%;
                border-radius: 4px;
                padding: 10px 12px;
                font-size: 100%;
                font-weight: normal;
                border: 1px solid var(--color-border);
                transition: border-color 150ms ease-in-out 0s;
                outline: none;
                color: rgb(33, 49, 60);
                background-color: rgb(255, 255, 255);
            }

            input::placeholder {
                opacity: 0.5;
            }

            ul {
                list-style: none;
                padding: 0;
                margin: 0;
                position: relative;
                background: white;
                border: 1px solid var(--color-border);
                overflow: auto;
            }

            :host([listmode="click"]) ul {
                position: absolute;
                top: 38px;
                left: 0;
                right: 0;
                max-height: 50vh;
                z-index: 2;
            }

            svg {
                position: absolute;
                top: 50%;
                right: 10px;
                padding: 0px 15px;
                transform: translateY(-50%);
                fill: gray;
                box-sizing: unset;
                width: 20px;
                height: 20px;
            }

            :host([listmode="click"]) svg {
                position: absolute;
                top: 50%;
                padding: 0px;
                right: 10px;
                transform: translateY(-50%);
                fill: gray;
                box-sizing: unset;
                width: 20px;
                height: 20px;
            }

            :host([active="false"]) ul {
                visibility: hidden;
            }

            .option {
                padding: 25px;
                border-top: 1px solid #f2f2f2;
            }

            .category {
                padding: 10px 25px;
                background: gainsboro;
                border-top: 1px solid gray;
                border-bottom: 1px solid gray;
                font-size: 90%;
                font-weight: bold;
                position: sticky;
                top: 0;
                z-index: 1;
            }

            .option:hover {
                background: #f2f2f2;
                cursor: pointer;
            }

            .label {
                margin: 0;
            }

            .label {
                display: flex;
                gap: 10px;
            }

            [disabled]:not([hidden]) {
                display: flex;
                justify-content: space-between;
                align-items: center;
                pointer-events: none;
                opacity: 0.4;
            }

            [disabled]::after {
                content: var(--disabled-label, "Not available");
                text-align: left;
                padding-left: 25px;
                opacity: 70%;
                font-size: 90%;
                white-space: nowrap;
                min-width: min-content;
            }
        `;
    }

    static get properties() {
        return {
            options: { type: Object },
            showAllWhenEmpty: { type: Boolean },
            listMode: { type: String, reflect: true },
        };
    }

    updated() {
        const options = this.shadowRoot.querySelectorAll(".option");
        this.#options = Array.from(options).map((option) => {
            const keywordString = option.getAttribute("data-keywords");
            const keywords = keywordString ? JSON.parse(keywordString) : [];
            return { option, keywords, label: option.querySelector(".label").innerText };
        });

        this.#initialize();
    }

    onSelect = (id, value) => {};

    #displayValue = (option) => {
        return option?.label ?? option?.value ?? option?.key ?? (this.#isObject(option) ? undefined : option);
    };

    #onSelect = (option) => {
        const input = this.shadowRoot.querySelector("input");

        if (this.listMode === "click") {
            input.value = this.#displayValue(option);
            this.setAttribute("active", false);
            return this.onSelect(option);
        }

        input.value = "";
        this.#initialize();
        this.onSelect(option);
    };

    #options = [];
    #initialize = () => {
        this.#options.forEach(({ option }) =>
            option[this.showAllWhenEmpty ? "removeAttribute" : "setAttribute"]("hidden", "")
        );

        if (!this.showAllWhenEmpty) this.setAttribute("active", false);
    };

    list = document.createElement("ul");

    categories = {};

    #sortedCategories = [];

    #populate = (input) => {
        const toShow = [];

        // Check if the input value matches the label
        this.#options.forEach(({ option, label }, i) => {
            if (label.toLowerCase().includes(input.toLowerCase()) && !toShow.includes(i)) toShow.push(i);
        });

        // Check if the input value matches any of the keywords
        this.#options.forEach(({ option, keywords = [] }, i) => {
            keywords.forEach((keyword) => {
                if (keyword.toLowerCase().includes(input.toLowerCase()) && !toShow.includes(i)) toShow.push(i);
            });
        });

        this.#options.forEach(({ option }, i) => {
            if (toShow.includes(i)) {
                option.removeAttribute("hidden");
            } else {
                option.setAttribute("hidden", "");
            }
        });

        this.#sortedCategories.forEach(({ entries, element }) => {
            if (entries.reduce((acc, entryElement) => acc + entryElement.hasAttribute("hidden"), 0) === entries.length)
                element.setAttribute("hidden", "");
            else element.removeAttribute("hidden");
        });

        this.setAttribute("active", !!toShow.length);
        this.setAttribute("interacted", true);
    };

    render() {
        this.categories = {};

        // Update list
        this.list.remove();
        this.list = document.createElement("ul");

        if (this.disabledLabel) this.style.setProperty("--disabled-label", `"${this.disabledLabel}"`);
        else this.style.removeProperty("--disabled-label");

        const slot = document.createElement("slot");
        this.list.appendChild(slot);

        if (this.options) {
            const options = this.options.map((item) => {
                return {
                    label: item.key,
                    ...item,
                };
            });

            const itemEls = options
                .sort((a, b) => {
                    if (a.label < b.label) return -1;
                    if (a.label > b.label) return 1;
                    return 0;
                }) // Sort alphabetically
                .sort((a, b) => {
                    if (a.disabled && b.disabled) return 0;
                    else if (a.disabled) return 1;
                    else if (b.disabled) return -1;
                }) // Sort with the disabled options at the bottom
                .map((option) => {
                    const li = document.createElement("li");
                    li.classList.add("option");
                    li.setAttribute("hidden", "");
                    if (option.keywords) li.setAttribute("data-keywords", JSON.stringify(option.keywords));
                    li.addEventListener("click", (ev) => {
                        ev.stopPropagation();
                        this.#onSelect(option);
                    });

                    if (option.disabled) li.setAttribute("disabled", "");

                    const container = document.createElement("div");

                    const label = document.createElement("h4");
                    label.classList.add("label");
                    label.innerText = option.label;

                    const info = document.createElement("span");

                    if (option.description) {
                        info.innerText = "ℹ️";
                        label.append(info);

                        tippy(info, {
                            content: `<p>${option.description}</p>`,
                            allowHTML: true,
                            placement: "right",
                        });
                    }

                    container.appendChild(label);

                    if (option.keywords) {
                        const keywords = document.createElement("small");
                        keywords.classList.add("keywords");
                        keywords.innerText = option.keywords.join(", ");
                        container.appendChild(keywords);
                    }

                    li.append(container);

                    if (option.category) {
                        let category = this.categories[option.category];
                        if (!category) {
                            category = document.createElement("div");
                            category.innerText = option.category;
                            category.classList.add("category");
                            this.categories[option.category] = {
                                entries: [],
                                element: category,
                            };
                        }

                        this.categories[option.category].entries.push(li);
                        return;
                    }

                    return li;
                })
                .filter((itemElement) => itemElement);

            this.list.append(...itemEls);
        }

        // Categories sorted alphabetically
        const categories = (this.#sortedCategories = Object.values(this.categories).sort((a, b) => {
            if (a.element.innerText < b.element.innerText) return -1;
            if (a.element.innerText > b.element.innerText) return 1;
            return 0;
        }));

        categories.forEach(({ entries, element }) => {
            this.list.append(element, ...entries);
        });

        const valueToDisplay = this.#displayValue(this.#value);

        return html`
    <div class="header" style=${styleMap({
        ...this.headerStyles,
    })}>
      <input placeholder="Type here to search" value=${valueToDisplay} @click=${(ev) => {
          ev.stopPropagation();
          if (this.listMode === "click") {
              const input = ev.target.value;
              this.#populate(input);
          }
      }} @input=${(ev) => {
          const input = ev.target.value;
          this.#populate(input);
      }}

      @blur=${(ev) => {
          this.submit();
      }}

      ></input>
      ${unsafeHTML(searchSVG)}
    </div>
    ${this.list}
    `;
    }
}

customElements.get("nwb-search") || customElements.define("nwb-search", Search);
