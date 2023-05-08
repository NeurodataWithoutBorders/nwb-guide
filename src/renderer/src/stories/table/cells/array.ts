import { css, html } from "lit";
import { TableCellBase } from "./base";
import { BaseRenderer } from "./renderers/base";

export class ArrayRenderer extends BaseRenderer {


    static get styles() {
        return [
            css`
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
        ]
    }

    // Parse to an array
    #parseValue = (value: any = this.value): any[] => {
        if (!value) return [];
        else if (typeof value === "string") return value.split(",");
        else if (!Array.isArray(value)) return [value];
        return value
    }

    constructor(...args: any[]) {
        super(...args)
    }

    ul = document.createElement('ul')

    // set = (value: any) => {
        
    // }

    get = () => {
        return this.#parseValue()
    }

    render() {
        return html`
            <ul>
                ${this.get().map(v => html`<li>${v}</li>`)}
            </ul>
        `
    }
}

customElements.get("nwb-array-renderer") || customElements.define("nwb-array-renderer", ArrayRenderer);


export class ArrayCell extends TableCellBase {

    constructor(...args){
        super(...args)
    }

    renderer = new ArrayRenderer({ value: this.value })
}

customElements.get("nwb-array-cell") || customElements.define("nwb-array-cell", ArrayCell);
