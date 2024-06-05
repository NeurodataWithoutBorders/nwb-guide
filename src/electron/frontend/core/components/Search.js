import { LitElement, html, css } from "lit";
import { styleMap } from "lit/directives/style-map.js";

import searchSVG from "../../assets/icons/search.svg?raw";

import tippy from "tippy.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

const ALTERNATIVE_MODES = ["input", "append"];

export class Search extends LitElement {
    constructor({
        value,
        options,
        showAllWhenEmpty = true,
        listMode = "list",
        headerStyles = {},
        disabledLabel,
        onSelect,
        placeholder = "Type here to search",
        strict = false,
    } = {}) {
        super();
        this.#value = value;
        this.options = options;
        this.placeholder = placeholder;
        this.showAllWhenEmpty = showAllWhenEmpty;
        this.disabledLabel = disabledLabel;
        this.listMode = listMode;
        this.headerStyles = headerStyles;
        this.strict = strict;
        if (onSelect) this.onSelect = onSelect;

        // document.addEventListener("click", () => this.#close());
    }

    #close = () => {
        console.log("CLOSING", this.getSelectedOption());
        if (this.listMode === "input" && this.getAttribute("interacted") === "true") {
            this.setAttribute("interacted", false);
            this.#onSelect(this.getSelectedOption());
        } else if (this.listMode !== "list") {
            this.setAttribute("active", false);
        }
    };

    #value;

    #isObject(value = this.#value) {
        return value && typeof value === "object";
    }

    #getOption = ({ label, value } = {}) => {
        return this.options.find((item) => {
            if (label && item.label === label) return true;
            if (value && value === item.value) return true;
        });
    };

    getSelectedOption = () => {
        const inputValue = (this.shadowRoot.querySelector("input") ?? this).value;
        const matched = this.#getOption({ label: inputValue });
        return matched ?? { value: inputValue };
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

            :host([listmode="input"]) ul,
            :host([listmode="append"]) ul {
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

            a {
                text-decoration: none;
            }

            a:after {
                content: "🔗";
                padding-left: 2px;
                font-size: 60%;
            }

            :host([listmode="input"]) svg,
            :host([listmode="append"]) svg {
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
                padding: 10px 18px;
                border-top: 1px solid #f2f2f2;
            }

            .category {
                padding: 10px 18px;
                background: gainsboro;
                border-top: 1px solid gray;
                border-bottom: 1px solid gray;
                font-size: 90%;
                font-weight: bold;
                position: sticky;
                top: 0;
                z-index: 1;
            }

            .structured-keywords {
                font-size: 90%;
                color: dimgrey;
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
            placeholder: { type: String },
            options: { type: Object },
            showAllWhenEmpty: { type: Boolean },
            listMode: { type: String, reflect: true },
            strict: { type: Boolean, reflect: true },
        };
    }

    updated() {
        const options = this.shadowRoot.querySelectorAll(".option");
        this.#options = Array.from(options).map((option) => {
            const keywordString = option.getAttribute("data-keywords");
            const structuredKeywordString = option.getAttribute("data-structured-keywords");

            const keywords = keywordString ? JSON.parse(option.getAttribute("data-keywords")) : [];
            const structuredKeywords = structuredKeywordString ? JSON.parse(structuredKeywordString) : {};

            return { option, keywords, structuredKeywords, label: option.querySelector(".label").innerText };
        });

        this.#initialize();

        if (!ALTERNATIVE_MODES.includes(this.listMode)) this.#populate();
    }

    onSelect = (id, value) => {};

    #displayValue = (option) => {
        return option?.label ?? option?.value ?? option?.key ?? (this.#isObject(option) ? undefined : option);
    };

    #onSelect = (option) => {
        const inputMode = this.listMode === "input";
        const input = this.shadowRoot.querySelector("input");

        const selectedOption = this.#getOption({ value: option.value });

        if (inputMode) this.setAttribute("active", false);

        if (this.strict && !selectedOption) {
            input.value = this.#value.label ?? this.#value.key ?? "";
            return;
        }

        if (inputMode) {
            this.value = selectedOption ?? option;
            input.value = this.#displayValue(option);
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

    getTokens = (input) =>
        input
            .replaceAll(/[^\w\s]/g, "")
            .split(" ")
            .map((token) => token.trim().toLowerCase())
            .filter((token) => token);

    #populate = (input = this.value ?? "") => {
        const toShow = [];

        const inputTokens = this.getTokens(input);

        // Check if the input value matches the label or any of the keywords
        this.#options.forEach(({ label, keywords, structuredKeywords }, i) => {
            const labelTokens = this.getTokens(label);
            const allKeywords = [...keywords, ...Object.values(structuredKeywords).flat()];
            const allKeywordTokens = allKeywords.map((keyword) => this.getTokens(keyword)).flat();
            const allTokens = [...labelTokens, ...allKeywordTokens];

            const result = inputTokens.reduce((acc, token) => {
                for (let subtoken of allTokens) {
                    if (subtoken.startsWith(token) && !toShow.includes(i)) return (acc += 1);
                }
                return acc;
            }, 0);

            if (result === inputTokens.length) toShow.push(i);
        });

        this.#options.forEach(({ option }, i) => {
            if (toShow.includes(i) || !inputTokens.length) {
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

        this.setAttribute("active", !!toShow.length || !inputTokens.length);
        this.setAttribute("interacted", true);
    };

    #ignore = false;

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
                    const listItemElement = document.createElement("li");
                    listItemElement.classList.add("option");
                    listItemElement.setAttribute("hidden", "");
                    listItemElement.setAttribute("tabindex", -1);

                    const { disabled, structuredKeywords, keywords } = option;

                    if (structuredKeywords)
                        listItemElement.setAttribute(
                            "data-structured-keywords",
                            JSON.stringify(option.structuredKeywords)
                        );
                    if (keywords) listItemElement.setAttribute("data-keywords", JSON.stringify(option.keywords));

                    listItemElement.addEventListener("click", (clickEvent) => {
                        clickEvent.stopPropagation();
                        if (this.#ignore) return (this.#ignore = false);
                        this.#onSelect(option);
                    });

                    if (disabled) listItemElement.setAttribute("disabled", "");

                    const container = document.createElement("div");

                    const label = document.createElement("h4");
                    label.classList.add("label");
                    label.innerText = option.label;

                    if (option.description || option.link) {
                        const info = option.link ? document.createElement("a") : document.createElement("span");
                        if (option.link) {
                            info.setAttribute("data-link", true);
                            info.href = option.link;
                            info.target = "_blank";
                        }

                        info.innerText = "ℹ️";
                        label.append(info);

                        if (option.description)
                            tippy(info, {
                                content: `<p>${option.description}</p>`,
                                allowHTML: true,
                                placement: "right",
                            });
                    }

                    container.appendChild(label);

                    if (keywords) {
                        const keywordsElement = document.createElement("small");
                        keywordsElement.classList.add("keywords");
                        keywordsElement.innerText = option.keywords.join(", ");
                        container.appendChild(keywordsElement);
                    }

                    if (structuredKeywords) {
                        const div = document.createElement("div");
                        div.classList.add("structured-keywords");

                        Object.entries(structuredKeywords).forEach(([key, value]) => {
                            const keywordsElement = document.createElement("small");
                            const capitalizedKey = key[0].toUpperCase() + key.slice(1);
                            keywordsElement.innerHTML = `<b>${capitalizedKey}:</b> ${value.join(", ")}`;
                            div.appendChild(keywordsElement);
                        });

                        container.appendChild(div);
                    }

                    listItemElement.append(container);

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

                        this.categories[option.category].entries.push(listItemElement);
                        return;
                    }

                    return listItemElement;
                })
                .filter((listItemElement) => listItemElement);

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
      <input placeholder=${this.placeholder} value=${valueToDisplay} @click=${(clickEvent) => {
          clickEvent.stopPropagation();
          if (ALTERNATIVE_MODES.includes(this.listMode)) {
              const input = clickEvent.target.value;
              this.#populate(input);
          }
      }}

      @input=${(inputEvent) => {
          const input = inputEvent.target.value;
          this.#populate(input);
      }}

      @blur=${(blurEvent) => {
          const relatedTarget = blurEvent.relatedTarget;
          if (relatedTarget) {
              if (relatedTarget.classList.contains("option")) return;
              if (relatedTarget.hasAttribute("data-link")) {
                  this.#ignore = true;
                  return;
              }
          }

          this.#close();
      }}

      ></input>
      ${unsafeHTML(searchSVG)}
    </div>
    ${this.list}
    `;
    }
}

customElements.get("nwb-search") || customElements.define("nwb-search", Search);
