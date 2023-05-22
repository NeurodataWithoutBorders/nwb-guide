import { css, html } from "lit";
import { TableCellBase } from "./base";
import { BaseRenderer } from "./renderers/base";


const parseArray = (value: any): any[] => {
    if (!value) return [];
    else if (typeof value === "string") return value.trim().split(",").filter(str => str);
    else if (!Array.isArray(value)) return [value];
    return value
}

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

    constructor(...args: any[]) {
        super(...args)
    }

    ul = document.createElement('ul')

    render() {
        return html`
            <ul>
                ${parseArray(this.value).map(v => html`<li>${v}</li>`)}
            </ul>
        `
    }
}

customElements.get("nwb-array-renderer") || customElements.define("nwb-array-renderer", ArrayRenderer);


export class ArrayCell extends TableCellBase {

    constructor(...args){
        super(...args)
    }

    getValue = (value = this.value) => parseArray(value) // NOTE: Must default to current value

    renderer = new ArrayRenderer({ value: this.value })
}

customElements.get("nwb-array-cell") || customElements.define("nwb-array-cell", ArrayCell);
