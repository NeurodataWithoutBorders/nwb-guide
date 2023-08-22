import { LitElement, html, css } from "lit";
import { StatusIndicator, StatusIndicatorProps, StatusIndicatorPropKeys } from "./StatusIndicator";

type StatusBarProps = {
    items: StatusIndicatorProps[]
}

export class StatusBar extends LitElement {
    static get styles() {
        return css`

            :host {
                display: flex;
                user-select: none;
                border: 1px solid lightgray;
                border-radius: 10px;
                flex-wrap: wrap;
                overflow: hidden;
            }

            nwb-status-indicator {
                flex-grow: 1;
                border-top: 1px solid lightgray;
                border-left: 1px solid lightgray;
                margin-top: -1px;
                margin-left: -1px;
            }
        `;
    }


    #items: StatusBarProps['items'] = []
    indicators: StatusIndicator[] = []

    set items(v: StatusBarProps['items']){
        this.#items = v.map(o => { return {...o} })

    }

    get items() {
        return this.#items
    }

    constructor(props: StatusBarProps) {
        super();
        Object.assign(this, props)
    }

    render() {
        this.indicators = this.items.map(o => new StatusIndicator(o))
        this.indicators.forEach((indicator, i) => {
            const item = this.items[i]
            StatusIndicatorPropKeys.forEach(key => Object.defineProperty(item, key, {get: () => indicator[key], set: (v) => indicator[key] = v}))
        })
        return html`<slot>${this.indicators}</slot>`;
    }
}

customElements.get("nwb-status-bar") || customElements.define("nwb-status-bar", StatusBar);
