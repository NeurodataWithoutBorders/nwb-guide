import { LitElement, html, css } from "lit";

import tippy from "tippy.js";

export class Search extends LitElement {
    constructor({ options, showAllWhenEmpty, disabledLabel } = {}) {
        super();
        this.options = options;
        this.showAllWhenEmpty = showAllWhenEmpty;
        this.disabledLabel = disabledLabel;
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
                overflow: hidden;
            }

            .header {
                padding: 25px;
                background: white;
            }

            input {
                width: 100%;
                background: #f2f2f2;
                border: 1px solid #d9d9d9;
                border-radius: 10px;
                padding: 10px 15px;
            }

            ul {
                list-style: none;
                padding: 0;
                margin: 0;
                position: relative;
                overflow: auto;
                background: white;
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
        };
    }

    updated() {
        const options = this.shadowRoot.querySelectorAll(".option");
        this.#options = Array.from(options).map((option) => {
            const keywords = JSON.parse(option.getAttribute("data-keywords"));
            return { option, keywords, label: option.querySelector(".label").innerText };
        });

        this.#initialize();
    }

    onSelect = (id, value) => {};

    #onSelect = (id, value) => {
        this.shadowRoot.querySelector("input").value = "";
        this.#initialize();
        this.onSelect(id, value);
    };

    #options = [];
    #initialize = () =>
        this.#options.forEach(({ option }) =>
            option[this.showAllWhenEmpty ? "removeAttribute" : "setAttribute"]("hidden", "")
        );

    list = document.createElement("ul");

    categories = {};

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
            const options = this.options.map((o) => {
                return {
                    label: o.key,
                    ...o,
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
                    li.setAttribute("data-keywords", JSON.stringify(option.keywords));
                    li.addEventListener("click", () => this.#onSelect(option));

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

                    const keywords = document.createElement("small");
                    keywords.classList.add("keywords");
                    keywords.innerText = option.keywords.join(", ");
                    container.appendChild(keywords);

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

                    return el;
                })
                .filter((el) => el);

            this.list.append(...itemEls);
        }

        // Categories sorted alphabetically
        const categories = Object.values(this.categories).sort((a, b) => {
            if (a.element.innerText < b.element.innerText) return -1;
            if (a.element.innerText > b.element.innerText) return 1;
            return 0;
        });

        categories.forEach(({ entries, element }) => {
            this.list.append(element, ...entries);
        });

        return html`
    <div class="header">
      <input placeholder="Type here to search" @input=${(ev) => {
          const input = ev.target.value;

          // Hide all if empty
          if (!input) {
              this.#initialize();
              return;
          }

          const toShow = [];
          // Check if the input value matches the label
          this.#options.forEach(({ option, label }, i) => {
              if (label.toLowerCase().includes(input.toLowerCase()) && !toShow.includes(i)) toShow.push(i);
          });

          // Check if the input value matches any of the keywords
          this.#options.forEach(({ option, keywords }, i) => {
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

          categories.forEach(({ entries, element }) => {
              if (entries.reduce((acc, el) => acc + el.hasAttribute("hidden"), 0) === entries.length)
                  element.setAttribute("hidden", "");
              else element.removeAttribute("hidden");
          });
      }}></input>
    </div>
    ${this.list}
    `;
    }
}

customElements.get("nwb-search") || customElements.define("nwb-search", Search);
