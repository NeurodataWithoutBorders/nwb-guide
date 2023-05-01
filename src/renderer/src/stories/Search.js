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

            .hidden {
                display: none;
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
        this.#options.forEach(({ option }) => option.classList[this.showAllWhenEmpty ? "remove" : "add"]("hidden"));

    list = document.createElement("ul");

    render() {
        // Update list
        this.list.remove();
        this.list = document.createElement("ul");

        const slot = document.createElement("slot");
        this.list.appendChild(slot);

        if (this.options) {
            this.options.forEach((option) => {
                const li = document.createElement("li");
                li.classList.add("option");
                li.classList.add("hidden");
                li.setAttribute("data-keywords", JSON.stringify(option.keywords));
                li.addEventListener("click", () => this.#onSelect(option));

                const label = document.createElement("h4");
                label.classList.add("label");
                label.innerText = option.label;
                li.appendChild(label);

                const keywords = document.createElement("small");
                keywords.classList.add("keywords");
                keywords.innerText = option.keywords.join(", ");
                li.appendChild(keywords);

                this.list.appendChild(li);
            });
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
                  option.classList.remove("hidden");
              } else {
                  option.classList.add("hidden");
              }
          });
      }}></input>
    </div>
    ${this.list}
    `;
    }
}

customElements.get("nwb-search") || customElements.define("nwb-search", Search);
