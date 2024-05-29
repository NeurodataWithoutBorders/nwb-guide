
import { TableCellBase } from "./base";
import { BaseRenderer } from './renderers/base';

import { LitElement, html, css } from 'lit';

type DropdownProps = {
    open: boolean,
    items: any[]
}

class Dropdown extends LitElement {
  static styles = css`

    * {
        box-sizing: border-box;
    }

    :host([open]) {
        display: block;
    }

    :host {
        display: none;
        position: absolute;
        z-index: 1000;
        background-color: #f9f9f9;
        min-width: 160px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    }

    ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
        max-height: 100px;
        overflow-y: auto;
    }

    ul li {
        cursor: pointer;
    }

    li {
        padding: 10px;
    }

    li:hover {
        background-color: #f1f1f1;
    }

  `;

  constructor(props: Partial<DropdownProps>) {
    super();
    Object.assign(this, props);
  }

  static get properties() {
    return {
        open: { type: Boolean, reflect: true },
        items: { type: Array }
    };
  }

  #select = (value) => {
    this.dispatchEvent(new CustomEvent("change", { detail: value }));
    this.open = false
  }

  render() {
    return html`
    <ul>${this.items.map((item) => html`<li @click=${() => this.#select(item)}>${item}</li>`)}</ul>
    `;
  }

  toggleDropdown = (state = !this.open) => this.open = state;
}

customElements.get("nwb-dropdown") || customElements.define("nwb-dropdown", Dropdown);

export class DropdownCell extends TableCellBase {

    constructor(props) {
        super(props);
    }


    // renderer = new NestedRenderer({ value: this.value })

    editor = new EnumEditor({
        schema: this.schema,
    })

}

customElements.get("nwb-dropdown-cell") || customElements.define("nwb-dropdown-cell", DropdownCell);


export class EnumEditor extends BaseRenderer {

    INPUT = document.createElement("input")

    static get styles() {
        return css`

            * {
                box-sizing: border-box;
            }

            input {
                background: transparent;
                border: none;
                width: 100%;
                height: 100%;
                padding: 7px 10px;
            }

            input:focus {
                outline: none;
            }
        `
    }

    __value = undefined
    get value() {
        return this.__value
    }

    set value(value) {
        this.__value = value
        if (this.INPUT) this.INPUT.value = value
    }

    constructor(props) {
        super(props);
        Object.assign(this, props);

        this.INPUT.setAttribute("size", "1")

        const dropdown = this.DROPDOWN = new Dropdown({ items: this.schema.enum })

        document.body.appendChild(dropdown)

        const toResolve: { resolve?: Function } = {}
        this.INPUT.addEventListener("blur", async (ev) => {

            if (toResolve.resolve) return toResolve.resolve()

            ev.stopPropagation()

            const promise = new Promise((resolve) => {
                toResolve.resolve = () => {
                    delete toResolve.resolve
                    resolve(true)
                }

                setTimeout(() => {
                    this.INPUT.focus()
                    this.INPUT.blur()
                }, 100)

            })

            await promise
        })

        dropdown.addEventListener("change", (e) => {
            this.value = e.detail
            if (toResolve.resolve) toResolve.resolve()
        })
    }

    render() {
        return html`${this.INPUT}`
    }

    focus() {
        this.INPUT.focus();
    }

    close() {
        this.DROPDOWN.toggleDropdown(false)
    }

    onEditStart () {
        this.DROPDOWN.toggleDropdown(true)
        const { top, left, height } = this.getBoundingClientRect()
        this.DROPDOWN.style.top = `${top + height}px`
        this.DROPDOWN.style.left = `${left}px`
        this.focus();// Allow blur
    }

    onEditEnd = () => {
        this.close()
    }
}

customElements.get("nwb-enum-editor") || customElements.define("nwb-enum-editor", EnumEditor);
