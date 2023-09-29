import { LitElement, html, css } from "lit";
import { styleMap } from "lit/directives/style-map.js";

export class Search extends LitElement {
    constructor({ options, showAllWhenEmpty } = {}) {
        super();
        this.options = options;
        this.showAllWhenEmpty = showAllWhenEmpty;
    }

    static get styles() {
        return css`
            * {
                box-sizing: border-box;
            }

            :host {
                position: relative;
                display: block;
                background: white;
                border-radius: 5px;
                width: 100%;
            }

            .header {
                padding: 25px;
                background: white;
                position: sticky;
                top: 0;
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
                position: absolute;
                left: 0;
                right: 0;
                z-index: 1;
                background: white;
            }

            .option {
                padding: 25px;
                border-top: 1px solid #f2f2f2;
            }

            .option:hover {
                background: #f2f2f2;
                cursor: pointer;
            }

            .label {
                margin: 0;
            }

            [disabled] {
                pointer-events: none;
                opacity: 0.4;
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

    render() {
        // Update list
        this.list.remove();
        this.list = document.createElement("ul");

        const slot = document.createElement("slot");
        this.list.appendChild(slot);

        if (this.options) {
            const unsupported = this.options
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
                .filter((option) => {
                    const li = document.createElement("li");
                    li.classList.add("option");
                    li.setAttribute("hidden", "");
                    li.setAttribute("data-keywords", JSON.stringify(option.keywords));
                    li.addEventListener("click", () => this.#onSelect(option));

                    if (option.disabled) li.setAttribute("disabled", "");

                    const label = document.createElement("h4");
                    label.classList.add("label");
                    label.innerText = option.label;
                    li.appendChild(label);

                    const keywords = document.createElement("small");
                    keywords.classList.add("keywords");
                    keywords.innerText = option.keywords.join(", ");
                    li.appendChild(keywords);

                    this.list.appendChild(li);

                    return option.disabled
                }).map(o => o.label);

                console.warn('Supported Interface Count:', this.options.length - unsupported.length)
                console.warn('Unsupported Interfaces:', unsupported)
        }

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
      }}></input>
    </div>
    ${this.list}
    `;
    }
}

customElements.get("nwb-search") || customElements.define("nwb-search", Search);
