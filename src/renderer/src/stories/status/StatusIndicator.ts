import { LitElement, html, css } from "lit";

import {
    errorHue,
    successHue,
    warningHue,
} from "../globals";

export type StatusIndicatorProps = {
    label: string | any,
    value?: string
    status?: boolean
}

export const StatusIndicatorPropKeys = ['label', 'value', 'status']

export class StatusIndicator extends LitElement {
    static get styles() {
        return css`
            :host {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 5px 10px;
            }

            :host > * {
                display: flex;
                align-items: center;
            }

            :first-child {
                padding-right: 5px;
            }

            svg {
                width: 18px;
                height: 18px;
            }

            div {
                width: 7px;
                height: 7px;
                border: 1px solid lightgray;
                border-radius: 50%;
            }

            div.success {
                background: hsl(${successHue}, 100%, 70%);
            }

            div.fail {
                background: hsl(${errorHue}, 100%, 80%);
            }

            div.pending {
                background: hsl( ${warningHue}, 100%, 60%);
            }
        `;
    }

    declare label: StatusIndicatorProps['label']
    declare value: StatusIndicatorProps['value']
    declare status: StatusIndicatorProps['status']

    static get properties() {
        return {
            status: { type: Boolean, reflect: true },
            value: { type: String, reflect: true }
        }
    }

    constructor(props: StatusIndicatorProps) {
        super();
        Object.assign(this, props)
    }

    render() {
        return html`<b>${this.label}</b>${this.value != undefined ? html`<small>${this.value}</small>` : html`<div class="${this.status === false ? 'fail' : (this.status ? 'success' : 'pending')}"></div>`}`;
    }
}

customElements.get("nwb-status-indicator") || customElements.define("nwb-status-indicator", StatusIndicator);
