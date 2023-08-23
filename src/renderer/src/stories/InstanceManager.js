import { LitElement, css, html } from "lit";
import "./Button";
import { notify } from "../dependencies/globals";
import { Accordion } from "./Accordion";
import { InstanceListItem } from "./instances/item";
import { checkStatus } from "../validation";

export class InstanceManager extends LitElement {
    static get styles() {
        return css`
            * {
                box-sizing: border-box;
            }

            :host {
                width: 100%;
                display: flex;
                background: white;
                height: 100%;
            }

            :host > div {
                display: grid;
                grid-template-columns: fit-content(0) 1fr;
                grid-template-rows: minmax(0, 1fr);
                width: 100%;
            }

            :host > div > div {
                border: 1px solid #c3c3c3;
            }

            #selectedName {
                font-size: 18px;
                font-weight: bold;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                padding-right: 10px;
            }

            #add-new-button {
                box-sizing: border-box;
                padding: 0px 5px;
                width: 100%;
            }

            #instance-sidebar {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }

            #instance-header {
                background: #e5e5e5;
                border-bottom: 1px solid #c3c3c3;
                padding: 15px;
                white-space: nowrap;
            }

            #instance-list {
                list-style: none;
                padding: 5px;
                margin: 0;
                overflow-x: hidden;
                overflow-y: auto;
                height: 100%;
            }

            #instance-display {
                padding: 25px;
                border-left: 0;
                overflow-y: auto;
                overflow-x: hidden;
                height: 100%;
            }

            #instance-display > div {
                height: 100%;
            }

            #content {
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            input {
                width: 100%;
            }

            #new-manager *[hidden] {
                display: none;
            }

            #new-manager {
                height: 125px;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1;
            }

            .controls {
                padding: 10px;
                border-bottom: 1px solid gainsboro;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .controls > div {
                display: flex;
                gap: 10px;
            }

            #new-info {
                align-items: unset;
                width: 100%;
                padding: 10px 30px;
                display: flex;
            }

            #new-info > input {
                margin-right: 10px;
            }
        `;
    }

    constructor(props = {}) {
        super();
        this.instances = props.instances ?? {};
        this.header = props.header;
        this.instanceType = props.instanceType ?? "Instance";
        if (props.onAdded) this.onAdded = props.onAdded;
        if (props.onRemoved) this.onRemoved = props.onRemoved;
        this.controls = props.controls ?? [];
    }

    #dynamicInstances = {}

    getInstanceContent = ({ id, metadata }) => {
        const content = metadata.content ?? metadata;
        if (typeof content === 'function') {
            this.#dynamicInstances[id] = content
            return ''
        } else return content
    }

    updateState = (id, state) => {
        const item = this.#items.find((i) => i.id === id);

        item.status = state;

        // Carry the status upwards
        const path = id.split("/");

        let target = this.instances;
        for (let i = 0; i < path.length; i++) {
            const id = path.slice(0, i + 1).join("/");
            const accordion = this.#accordions[id];
            target = target[path[i]]; // Progressively check the deeper nested instances
            if (accordion) accordion.setSectionStatus(id, checkStatus(false, false, [...Object.values(target)]));
        }
    };

    // onAdded = () => {}
    // onRemoved = () => {}

    toggleInput = (force) => {
        const newInfoDiv = this.shadowRoot.querySelector("#new-info");
        if (force === true) {
            newInfoDiv.hidden = false;
        } else if (force === false) {
            newInfoDiv.hidden = true;
        } else {
            newInfoDiv.hidden = !newInfoDiv.hidden;
        }

        if (!newInfoDiv.hidden) {
            const input = this.shadowRoot.querySelector("#new-info input");
            input.focus();

            const mousePress = (e) => {
                if (!e.composedPath().includes(newInfoDiv)) {
                    this.#onKeyDone();
                    document.removeEventListener("pointerdown", mousePress);
                }
            };
            document.addEventListener("pointerdown", mousePress);
        }
    };

    #onKeyDone = () => {
        const button = this.shadowRoot.querySelector("#add-new-button");
        button.parentNode.hidden = false;
        this.toggleInput(false);
    };

    #mapCategoryToInstances = (base, category) => {
        let instances = {};
        Object.entries(category).forEach(([key, value]) => {
            const newKey = `${base}/${key}`;
            if (this.#isCategory(value)) instances = { ...this.#mapCategoryToInstances(value) };
            else instances[newKey] = value;
        });
        return instances;
    };

    #selected;

    // Correct bug where multiple instances are selected
    updated = () => {
        const selected = Array.from(this.shadowRoot.querySelectorAll("[selected]"));
        if (selected.length > 0)
            selected.slice(1).forEach((el) => {
                const instance = el.getAttribute("data-instance");
                el.removeAttribute("selected");
                this.shadowRoot.querySelector(`div[data-instance="${instance}"]`).setAttribute("hidden", "");
            });

        this.#onSelected()
    };

    #isCategory(value) {
        return typeof value === "object" && !(value instanceof HTMLElement) && !("content" in value);
    }

    #items = [];

    #onRemoved(ev) {
        const parent = ev.target.parentNode;
        const name = parent.getAttribute("data-instance");
        const ogPath = name.split("/");
        const path = [...ogPath];
        let target = toRender;
        const key = path.pop();
        target = path.reduce((acc, cur) => acc[cur], target);
        this.onRemoved(target[key], ogPath);
        delete target[key];

        if (parent.hasAttribute("selected")) {
            const previous = parent.previousElementSibling?.getAttribute("data-instance");
            if (previous) this.#selected = previous;
            else {
                const next = parent.nextElementSibling?.getAttribute("data-instance");
                if (next) this.#selected = next;
                else this.#selected = undefined;
            }
        }

        // parent.remove()
        // const instance = this.shadowRoot.querySelector(`div[data-instance="${name}"]`)
        // instance.remove()

        this.requestUpdate();
    }

    #hideAll(element) {
        Array.from(this.shadowRoot.querySelectorAll("div[data-instance]")).forEach((el) => {
            if (el !== element) el.hidden = true;
        });
    }

    #accordions = {};

    #onSelected = () => {
        const selected = this.shadowRoot.querySelector("#selectedName");
        selected.innerText = this.#selected;

        const dynamic = this.#dynamicInstances[this.#selected]
        if (typeof dynamic === 'function') {
            this.shadowRoot.querySelector(`div[data-instance="${this.#selected}"]`).append(this.#dynamicInstances[this.#selected] = dynamic())
        }
    };

    #render(toRender = this.instances, path = []) {
        let instances = {};
        let categories = [];

        Object.entries(toRender).forEach(([key, value]) => {
            const isCategory = this.#isCategory(value);
            // if (isCategory) instances = { ...instances, ...this.#mapCategoryToInstances(key, value) };
            // else instances[key] = value;
            let resolvedKey = [...path, key].join("/");

            if (isCategory) {
                const list = this.#render(value, [...path, key]);

                const accordion = new Accordion({
                    sections: {
                        [key]: {
                            content: list,
                        },
                    },
                    contentPadding: "10px",
                });

                this.#accordions[resolvedKey] = accordion;

                categories.push(accordion);
            } else {
                if (!this.#selected) this.#selected = resolvedKey;
                instances[resolvedKey] = value;
            }
        });

        const list = html`
            ${Object.entries(instances).map(([key, info], i) => {
                if (info instanceof HTMLElement || typeof info === 'function') info = { content: info };
                const listItemInfo = {
                    id: key,
                    label: key.split("/").pop(),
                    selected: key === this.#selected,
                    onRemoved: this.#onRemoved.bind(this),
                    ...info,
                };

                const item = new InstanceListItem(listItemInfo);

                this.#items.push(item);

                item.onClick = () => {
                    this.#selected = key;

                    const instances = Array.from(this.shadowRoot.querySelectorAll("div[data-instance]"));

                    const element = instances.find((el) => el.getAttribute("data-instance") === this.#selected);

                    if (element) {
                        element.hidden = false;
                        this.#hideAll(element);

                        this.#items.forEach((el) => {
                            if (el !== item) el.removeAttribute("selected");
                        });
                    }

                    this.#onSelected();
                };

                return item;
            })}
            ${categories}
        `;

        return list;
    }

    render() {
        this.#items = [];

        const instances = this.#render();

        return html`
            <div>
                <div id="instance-sidebar">
                    ${this.header ? html`<div id="instance-header"><h2>${this.header}</h2></div>` : ""}
                    <ul id="instance-list">
                        ${instances}
                    </ul>
                    ${this.onAdded
                        ? html`<div id="new-manager">
        <div id="new-info" class="item" hidden>
          <input></input>
          <nwb-button size="small" primary @click=${() => {
              const input = this.shadowRoot.querySelector("#new-info input");

              if (input.value) {
                  try {
                      const path = input.value.split("/");
                      const res = this.onAdded(path);

                      let resolvedPath = res?.key ? res.key.split("/") : path;
                      let resolvedValue = res instanceof HTMLElement ? res : res?.value ?? null;

                      let key = resolvedPath.pop();

                      let target = this.instances;
                      resolvedPath.forEach((key) => (target = target[key] = target[key] ?? {}));
                      target[key] = resolvedValue;

                      this.#onKeyDone();

                      // Swap the selected item to the new one
                      this.#selected = input.value;
                      this.#hideAll();

                      // Trigger new update
                      this.requestUpdate();
                  } catch (e) {
                      notify(e.message, "error");
                  }
                  input.value = "";
              }
          }}>Add</nwb-button>
        </div>
        <div class="item">
          <nwb-button
            id="add-new-button"
            @click=${(ev) => {
                ev.target.parentNode.hidden = true;
                this.toggleInput(true);
            }}

            icon="+"
            .buttonStyles=${{
                width: "100%",
            }}>Add ${this.instanceType}</nwb-button>
        </div>
      </div>`
                        : ""}
                </div>
                <div id="content">
                    <div class="controls">
                        <span id="selectedName"></span>
                        <div>
                            ${this.controls.map((o) => {
                                return html`<nwb-button
                                    size="small"
                                    icon=${o.icon}
                                    .primary=${o.primary ?? false}
                                    @click=${function () {
                                        const el = this.shadowRoot.querySelector(
                                            "#instance-display > div:not([hidden])"
                                        );
                                        o.onClick.call(this, el.getAttribute("data-instance"), el);
                                    }}
                                    >${o.name}</nwb-button
                                >`;
                            })}
                        </div>
                    </div>

                    <div id="instance-display">
                        ${this.#items.map((item, i) => {
                            return html`
                                <div data-instance="${item.id}" ?hidden=${this.#selected !== item.id}>
                                    ${this.getInstanceContent(item)}
                                </div>
                            `;
                        })}
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.get("nwb-instance-manager") || customElements.define("nwb-instance-manager", InstanceManager);
