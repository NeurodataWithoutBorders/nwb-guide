import { LitElement, css, html } from "lit";
import { Button } from "./Button";

export class CodeBlock extends LitElement {
    static get styles() {
        return css`
            :host {
                display: block;
                position: relative;
                font-size: 85%;
                background: #111;
                color: whitesmoke;
                border-radius: 10px;
                border: 1px solid gray;
                overflow: hidden;
            }

            pre {
                overflow: auto;
                padding: 15px;
                box-sizing: border-box;
                user-select: text;
                margin: 0;
            }
        `;
    }

    constructor({ text = "" }) {
        super();
        this.text = text;
    }

    render() {
        const controls = document.createElement("div");
        
        setTimeout(() => {
            console.log(controls)
        }, 1000)

        const copyButton = new Button({ 
            label: "Copy", 
            onClick: () => navigator.clipboard.writeText(this.text),
            primary: true,
            color: "rgba(0, 0, 0, 0.3)",
            buttonStyles: {
                color: "white",
                fontSize: "85%",
                borderRadius: "5px",
                border: "1px solid rgba(255, 255, 255, 0.5)",
            }
        })
        
        Object.assign(controls.style, {
            position: "absolute",
            bottom: "10px",
            right: "10px",
        })

        controls.append(copyButton);

        return html`
            ${controls}
            <pre><code>${this.text}</code></pre>
        `;
    }
}

customElements.get("code-block") || customElements.define("code-block", CodeBlock);
