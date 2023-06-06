import { LitElement, css, html } from "lit";

export class Chevron extends LitElement {

    static get styles() {
        return css`

        :host {
            transition: 0.5s;
        }

        div {
            transform: translateY(-3px);
        }

        div::before {
                border-style: solid;
                border-width: 0.25em 0.25em 0 0;
                content: '';
                display: inline-block;
                height: 0.45em;
                left: 0.15em;
                position: relative;
                top: 0.8em;
                transform: rotate(-45deg);
                vertical-align: top;
                width: 0.45em;
        }

        :host([direction=right]) div:before {
            left: 0;
            position: relative;
            top: 0.60em;
            transform: rotate(45deg);
        }

        :host([direction=bottom]) div:before {
            top: 0;
            top: 0.50em;
            transform: rotate(135deg);
        }

        :host([direction=left]) div:before {
            left: 0.25em;
            top: 0.60em;
	        transform: rotate(-135deg);
        }
        `
    }

    static get properties() {
        return {
            direction: {
                type: String,
                reflect: true
            }
        }
    }

    constructor({ direction, size, color } = {}){
        super()

        this.direction = direction ?? 'right'
        this.size = size
        this.color = color
    }

    render() {
        return html`
            <div color="${this.size}" size="${this.size}"></div>
        `
    }
}

customElements.get("nwb-chevron") ||
    customElements.define("nwb-chevron", Chevron);
