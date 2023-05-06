import { LitElement, css, html } from "lit";

export class ArrayRenderer extends LitElement {

    declare value: any[]

    static get styles() {
        return css`

            ul {
                list-style-type: none;
                padding: 0;
            }


            ul li:before {
                content: '-';
                position: absolute;
                margin-left: -10px;
            }

            ul li {
                padding-left: 20px
            }
        `
    }

    static get properties() {
        return {
            value: { reflect: true }
        }
    }

    // Parse to an array
    #parseValue = (value: any = this.value): any[] => {
        if (!value) return [];
        else if (typeof value === "string") return value.split(",");
        else if (!Array.isArray(value)) return [value];
        return value
    }

    constructor({ value = []} = {}) {
        super()
        this.value = value
    }

    ul = document.createElement('ul')

    render() {

        const value = this.#parseValue()

        return html`
            <ul>
                ${value.map(v => {
                    return html`<li>${v}</li?`
                })}
            </ul>
        `
        }
}

customElements.get("nwb-array-renderer") || customElements.define("nwb-array-renderer", ArrayRenderer);
