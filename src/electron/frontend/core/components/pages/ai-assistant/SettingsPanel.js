import { LitElement, html, css } from "lit";

/**
 * Inline settings panel for the AI assistant.
 * Controls API key and model selection.
 *
 * Settings are persisted to localStorage.
 */
export class SettingsPanel extends LitElement {
    static properties = {
        open: { type: Boolean },
        apiKey: { type: String, attribute: false },
        model: { type: String, attribute: false },
    };

    static STORAGE_KEY = "nwb-guide-ai-settings";

    static styles = css`
        :host {
            display: block;
        }

        .panel {
            background: #fafafa;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
        }

        .panel[hidden] {
            display: none;
        }

        h4 {
            margin: 0 0 12px;
            font-size: 0.95em;
            color: #333;
        }

        .field {
            margin-bottom: 12px;
        }

        label {
            display: block;
            font-size: 0.85em;
            font-weight: 500;
            color: #555;
            margin-bottom: 4px;
        }

        input[type="text"],
        input[type="password"],
        select {
            width: 100%;
            padding: 8px 10px;
            border: 1px solid #ccc;
            border-radius: 6px;
            font-size: 0.9em;
            box-sizing: border-box;
        }

        .hint {
            font-size: 0.8em;
            color: #888;
            margin-top: 2px;
        }

        .save-btn {
            background: #1976d2;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 0.85em;
            margin-top: 4px;
        }

        .save-btn:hover {
            background: #1565c0;
        }
    `;

    constructor() {
        super();
        this.open = false;
        this.apiKey = "";
        this.model = "claude-sonnet-4-5-20250929";
        this._loadSettings();
    }

    _loadSettings() {
        try {
            const raw = localStorage.getItem(SettingsPanel.STORAGE_KEY);
            if (raw) {
                const settings = JSON.parse(raw);
                this.apiKey = settings.apiKey || "";
                this.model = settings.model || "claude-sonnet-4-5-20250929";
            }
        } catch {
            // Ignore parse errors
        }
    }

    _saveSettings() {
        const settings = {
            apiKey: this.apiKey,
            model: this.model,
        };
        localStorage.setItem(SettingsPanel.STORAGE_KEY, JSON.stringify(settings));

        this.dispatchEvent(
            new CustomEvent("settings-changed", {
                detail: settings,
                bubbles: true,
                composed: true,
            })
        );
    }

    getSettings() {
        return {
            apiKey: this.apiKey || null,
            model: this.model,
        };
    }

    render() {
        return html`
            <div class="panel" ?hidden=${!this.open}>
                <h4>AI Assistant Settings</h4>

                <div class="field">
                    <label>Anthropic API Key</label>
                    <input
                        type="password"
                        .value=${this.apiKey}
                        @input=${(e) => {
                            this.apiKey = e.target.value;
                        }}
                        placeholder="sk-ant-..."
                    />
                    <div class="hint">
                        Get your API key from
                        <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a>
                    </div>
                </div>

                <div class="field">
                    <label>Model</label>
                    <select
                        .value=${this.model}
                        @change=${(e) => {
                            this.model = e.target.value;
                        }}
                    >
                        <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
                        <option value="claude-opus-4-6">Claude Opus 4.6</option>
                        <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
                    </select>
                </div>

                <button class="save-btn" @click=${() => this._saveSettings()}>Save Settings</button>
            </div>
        `;
    }
}

customElements.get("nwbguide-ai-settings") || customElements.define("nwbguide-ai-settings", SettingsPanel);
