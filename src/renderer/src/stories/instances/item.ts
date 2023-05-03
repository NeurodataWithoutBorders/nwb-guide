import { LitElement, css, html } from "lit";

import { errorHue, errorSymbol, successHue, successSymbol, warningHue, warningSymbol } from "../globals";

export class InstanceListItem extends LitElement {

    declare label: string
    declare status: string
    declare selected: boolean
    declare onRemoved?: Function

    static get styles() {
        return css`

        :host {
            display: block;
        }
        
        .item {
            padding: 5px;
            transition: background 0.5s;
            display: flex;
            align-items: center;
        }


        .item#new-info {
            align-items: unset;
        }

        .item > * {
            margin-right: 10px;
        }

        .item > *:last-child {
            margin-right: 0;
        }

        .item > span {
            position: relative;
            overflow: hidden;
            padding: 10px 20px;
            cursor: pointer;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: bold;
            border-radius: 8px;
            border: 1px solid #c3c3c3;
            white-space: nowrap;
        }

        :host([selected]) span,
        span:hover {
            background: #ececec;
        }

        .indicator {
            height: 100%;
            width: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            position: absolute;
            right: 0px;
            top: 0px;
            font-size: 0.8em;
        }

        :host([status=valid]) .indicator,
        :host([status=error]) .indicator,
        :host([status=warning]) .indicator {
            background: rgb(250, 250, 250);
            border-left: 1px solid rgb(195, 195, 195);
        }

        :host([status=warning]) .indicator {
            background: hsl(${warningHue}, 100%, 90%);
        }

        :host([status=valid]) .indicator {
            background: hsl(${successHue}, 100%, 90%);
        }

        :host([status=error]) .indicator {
            background: hsl(${errorHue}, 100%, 95%);
        }

        :host([status=valid]) span,
        :host([status=error]) span,
        :host([status=warning]) span {
            padding-right: 60px;
        }

        :host([status=valid]) .indicator::before {
            content: "${successSymbol}";
        }

        :host([status=error]) .indicator::before {
            content: "${errorSymbol}";
        }

        :host([status=warning]) .indicator::before {
            content: "${warningSymbol}";
        }
        
        `
    }

    static get properties() {
        return {
            label: { type: String, reflect: true },
            status: { type: String, reflect: true },
            selected: { type: Boolean, reflect: true },
        }
    }

    constructor({ label, status, selected, onRemoved, id, ...metadata } = {
        label: "",
        status: "",
        selected: false
    }) {
        super();
        this.id = id;
        this.label = label;
        this.status = status;
        this.selected = selected;
        this.metadata = metadata
        if (this.onRemoved) this.onRemoved = onRemoved;
    }

    #onClick () {
        this.onClick()
        this.setAttribute("selected", "")
    }

    onClick = () => {

    }

    render() {
        return html`
                <li
                    class="item"
                    data-instance="${this.label}"
                >
                    <span
                        @click="${() => this.#onClick()}"
                        >${this.label}
                        <div class="indicator"></div>
                    </span>
                    ${this.onRemoved
                        ? html`<nwb-button
                              size="small"
                              primary
                              color="gray"
                              @click=${this.onRemoved}
                              .buttonStyles=${{
                                  padding: "7px",
                              }}
                              >x</nwb-button
                          >`
                        : ""}
                </li>
            `
    }


}

customElements.get("nwb-instance-list-item") || customElements.define("nwb-instance-list-item", InstanceListItem);
