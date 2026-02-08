import { LitElement, html, css } from "lit";

/**
 * Text input with send button for the chat interface.
 *
 * Fires a "send-message" custom event with the message text in `detail`.
 */
export class ChatInput extends LitElement {
    static properties = {
        disabled: { type: Boolean },
        placeholder: { type: String },
    };

    static styles = css`
        :host {
            display: block;
        }

        .input-row {
            display: flex;
            gap: 8px;
            align-items: flex-end;
        }

        textarea {
            flex: 1;
            resize: none;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 10px 12px;
            font-family: inherit;
            font-size: 0.95em;
            line-height: 1.4;
            min-height: 40px;
            max-height: 120px;
            outline: none;
            transition: border-color 0.2s;
        }

        textarea:focus {
            border-color: #1976d2;
        }

        textarea:disabled {
            background: #f5f5f5;
            cursor: not-allowed;
        }

        button {
            background: #1976d2;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 0.95em;
            font-weight: 500;
            white-space: nowrap;
            transition: background 0.2s;
        }

        button:hover:not(:disabled) {
            background: #1565c0;
        }

        button:disabled {
            background: #bbb;
            cursor: not-allowed;
        }
    `;

    constructor() {
        super();
        this.disabled = false;
        this.placeholder = "Type your message...";
    }

    render() {
        return html`
            <div class="input-row">
                <textarea
                    .placeholder=${this.placeholder}
                    ?disabled=${this.disabled}
                    @keydown=${this._onKeyDown}
                    rows="1"
                ></textarea>
                <button ?disabled=${this.disabled} @click=${this._onSend}>Send</button>
            </div>
        `;
    }

    _onKeyDown(e) {
        // Auto-resize textarea
        const textarea = e.target;
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";

        // Submit on Enter (without Shift)
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            this._onSend();
        }
    }

    _onSend() {
        const textarea = this.shadowRoot.querySelector("textarea");
        const text = textarea.value.trim();
        if (!text || this.disabled) return;

        this.dispatchEvent(
            new CustomEvent("send-message", {
                detail: text,
                bubbles: true,
                composed: true,
            })
        );

        textarea.value = "";
        textarea.style.height = "auto";
    }
}

customElements.get("nwbguide-chat-input") || customElements.define("nwbguide-chat-input", ChatInput);
