

import { LitElement, html, css, unsafeCSS } from 'lit';

export type ProgressProps = {
    value?: {
        n: number,
        total: number
    },
}

const animationDuration = 500 // ms

export class ProgressBar extends LitElement {

    static animationDuration = animationDuration // ms

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
            transition: width ${unsafeCSS((animationDuration / 1000).toFixed(2))}s;
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
        if (!('n' in this.value)) this.value.n = 0
        if (!('total' in this.value)) this.value.total = 0
    }

    render() {
        const hasOne = this.value.n || this.value.total
        const value = this.value.n / this.value.total * 100
        const displayedValue = hasOne ? `${this.value.n}/${this.value.total}` : ''
        return html`<div><div style="width: ${value}%"></div></div><small>${displayedValue} ${!hasOne || isNaN(value) ? '' : `(${value.toFixed(0)}%)`}</small>`
    }
}

customElements.get('nwb-progress') || customElements.define('nwb-progress',  ProgressBar);
