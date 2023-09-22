import { LitElement, css, html } from "lit";

export class CodeBlock extends LitElement {

    static get styles() {
        return css`

            :host {
                display: block;
                font-size: 85%;
                background: #f2f1f1;
                border-radius: 10px;
                border: 1px solid gray;
                overflow: hidden;
            }

            pre {
                overflow: auto;
                padding: 5px 10px;
                box-sizing: border-box;
                user-select: text;
                margin: 0;
            }
        `
    }

    constructor({ text = '' }){
        super()
        this.text = text
    }

    render(){
        return html`<pre>${this.text}</pre>`
    }
}

customElements.get("code-block") ||
    customElements.define("code-block", CodeBlock);
