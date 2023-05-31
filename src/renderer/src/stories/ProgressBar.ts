

import { LitElement, html, css } from 'lit';

export type ProgressProps = {
    value?: {
        b: number,
        bsize?: number,
        tsize: number
    },
}

export class ProgressBar extends LitElement {

    static get styles() {
    return css`

        :host {
            display: flex;
            align-items: center;
        }

        :host > div {
            width: 100%;
            height: 10px;
            border: 1px solid lightgray;
            overflow: hidden;
        }

        :host > div > div {
            width: 0%;
            height: 100%;
            background-color: #029CFD;
            transition: width 0.5s;
        }

        small {
            white-space: nowrap;
            margin-left: 10px;
        }

    `;
    }

    static get properties() {
        return {
            value: {
                type: Object,
                reflect: true,
            }
        };
    }

    declare value: any

    constructor(props: ProgressProps = {}) {
        super();

        this.value = props.value ?? {}
        if (!('b' in this.value)) this.value.b = 0
        if (!('tsize' in this.value)) this.value.tsize = 0

    }

    render() {
        const value = this.value.b / this.value.tsize * 100
        return html`<div><div style="width: ${value}%"></div></div><small>${this.value.b}/${this.value.tsize} ${isNaN(value) ? '' : `(${value.toFixed(0)}%)`}</small>`
    }
}

customElements.get('nwb-progress') || customElements.define('nwb-progress',  ProgressBar);
