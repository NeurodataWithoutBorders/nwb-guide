import { html, css } from "lit";
import { Page } from "../Page.js";
import { baseUrl } from "../../../server/globals";

import "./ChatMessage.js";
import "./ChatInput.js";
import "./SettingsPanel.js";

/**
 * AI Assistant page — chat interface for the NWB conversion agent.
 *
 * Two views:
 * 1. Session list (home) — shows previous chats + "New Conversation" button
 * 2. Chat view — active conversation with message list + input
 *
 * Communicates with the Flask /ai namespace via:
 * - GET /ai/sessions (list saved sessions)
 * - POST /ai/sessions (create session)
 * - GET /ai/sessions/<id> (get session state or history)
 * - POST /ai/sessions/<id>/message (send message)
 * - GET /ai/sessions/<id>/events (SSE stream)
 * - DELETE /ai/sessions/<id> (delete session)
 */
export class AIAssistantPage extends Page {
    static properties = {
        ...super.properties,
        messages: { type: Array, state: true },
        sessionId: { type: String, state: true },
        dataDir: { type: String, state: true },
        isStreaming: { type: Boolean, state: true },
        settingsOpen: { type: Boolean, state: true },
        connected: { type: Boolean, state: true },
        savedSessions: { type: Array, state: true },
        viewMode: { type: String, state: true }, // "list" or "chat"
        isReadOnly: { type: Boolean, state: true },
        currentPhase: { type: Number, state: true },
        todos: { type: Array, state: true },
    };

    header = {
        title: "AI Assistant",
        subtitle: "Convert your data to NWB format with AI guidance.",
    };

    constructor(...args) {
        super(...args);
        this.messages = [];
        this.sessionId = null;
        this.dataDir = "";
        this.isStreaming = false;
        this.settingsOpen = false;
        this.connected = false;
        this.savedSessions = [];
        this.viewMode = "list";
        this.isReadOnly = false;
        this.currentPhase = 0;
        this.todos = [];
        this._eventSource = null;
        this._starting = false;

        this.style.height = "100%";
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadSessions();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._closeEventSource();
    }

    async _loadSessions() {
        try {
            const resp = await fetch(new URL("/ai/sessions", baseUrl));
            if (resp.ok) {
                const data = await resp.json();
                this.savedSessions = data.sessions || [];
            }
        } catch {
            // ignore — sessions list is optional
        }
    }

    render() {
        if (this.viewMode === "list") {
            return this._renderSessionList();
        }
        return this._renderChatView();
    }

    // ── Session List View ──────────────────────────────────────────────

    _renderSessionList() {
        return html`
            <style>
                ${this._sharedStyles()} .session-list-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    max-height: calc(100vh - 120px);
                }

                .session-list-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 0;
                    flex-shrink: 0;
                }

                .session-list-header h3 {
                    margin: 0;
                    color: #333;
                    font-size: 1.1em;
                }

                .new-chat-btn {
                    padding: 10px 20px;
                    background: #1976d2;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.9em;
                    font-weight: 500;
                }

                .new-chat-btn:hover {
                    background: #1565c0;
                }

                .session-list {
                    flex: 1;
                    overflow-y: auto;
                }

                .session-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    margin-bottom: 8px;
                    cursor: pointer;
                    transition:
                        background 0.15s,
                        border-color 0.15s;
                }

                .session-card:hover {
                    background: #f5f8ff;
                    border-color: #90caf9;
                }

                .session-card-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: #e3f2fd;
                    color: #1976d2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1em;
                    flex-shrink: 0;
                }

                .session-card-body {
                    flex: 1;
                    min-width: 0;
                }

                .session-card-title {
                    font-weight: 500;
                    color: #333;
                    font-size: 0.95em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .session-card-meta {
                    color: #888;
                    font-size: 0.8em;
                    margin-top: 2px;
                }

                .session-card-actions {
                    flex-shrink: 0;
                }

                .session-card-actions button {
                    padding: 4px 10px;
                    border: 1px solid #e0e0e0;
                    border-radius: 4px;
                    background: white;
                    cursor: pointer;
                    font-size: 0.8em;
                    color: #888;
                }

                .session-card-actions button:hover {
                    background: #ffebee;
                    color: #c62828;
                    border-color: #ef9a9a;
                }

                .empty-state {
                    text-align: center;
                    color: #888;
                    padding: 60px 20px;
                    font-size: 0.95em;
                    line-height: 1.8;
                }

                .empty-state h3 {
                    color: #555;
                    margin-bottom: 8px;
                }

                .settings-row {
                    display: flex;
                    justify-content: flex-end;
                    padding: 4px 0;
                    flex-shrink: 0;
                }

                .settings-row button {
                    padding: 6px 14px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    background: white;
                    cursor: pointer;
                    font-size: 0.85em;
                }

                .settings-row button:hover {
                    background: #f5f5f5;
                }
            </style>

            <div class="session-list-container">
                <nwbguide-ai-settings .open=${this.settingsOpen}></nwbguide-ai-settings>

                <div class="session-list-header">
                    <h3>Conversations</h3>
                    <div style="display: flex; gap: 8px;">
                        <button class="new-chat-btn" @click=${this._showNewChat}>+ New Conversation</button>
                        <button
                            style="padding: 8px 14px; border: 1px solid #ccc; border-radius: 8px; background: white; cursor: pointer; font-size: 0.85em;"
                            @click=${() => (this.settingsOpen = !this.settingsOpen)}
                        >
                            Settings
                        </button>
                    </div>
                </div>

                <div class="session-list">
                    ${this.savedSessions.length === 0
                        ? html`
                              <div class="empty-state">
                                  <h3>NWB Conversion Assistant</h3>
                                  <p>
                                      I'll help you convert your neurophysiology data to NWB format and publish it on
                                      DANDI Archive.
                                  </p>
                                  <p>Click <b>+ New Conversation</b> to get started.</p>
                              </div>
                          `
                        : this.savedSessions.map(
                              (s) => html`
                                  <div class="session-card" @click=${() => this._viewSession(s.session_id)}>
                                      <div class="session-card-icon">${s.message_count > 0 ? "..." : ""}</div>
                                      <div class="session-card-body">
                                          <div class="session-card-title">${s.title}</div>
                                          <div class="session-card-meta">
                                              ${this._formatDate(s.updated_at)} &middot; ${s.message_count} messages
                                              &middot; ${this._shortDir(s.data_dir)}
                                          </div>
                                      </div>
                                      <div class="session-card-actions">
                                          <button @click=${(e) => this._deleteSession(e, s.session_id)}>Delete</button>
                                      </div>
                                  </div>
                              `
                          )}
                </div>
            </div>
        `;
    }

    // ── Chat View ──────────────────────────────────────────────────────

    _renderChatView() {
        const PHASES = [
            "Experiment Discovery",
            "Data Inspection",
            "Metadata Collection",
            "Synchronization",
            "Code Generation",
            "Testing & Validation",
            "DANDI Upload",
        ];

        return html`
            <style>
                ${this._sharedStyles()} .ai-page {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    max-height: calc(100vh - 120px);
                }

                .ai-toolbar {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 0;
                    flex-shrink: 0;
                }

                .ai-toolbar input[type="text"] {
                    flex: 1;
                    padding: 8px 10px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    font-size: 0.9em;
                }

                .ai-toolbar button {
                    padding: 8px 16px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    background: white;
                    cursor: pointer;
                    font-size: 0.85em;
                    white-space: nowrap;
                }

                .ai-toolbar button:hover {
                    background: #f5f5f5;
                }

                .ai-toolbar button.primary {
                    background: #1976d2;
                    color: white;
                    border-color: #1976d2;
                }

                .ai-toolbar button.primary:hover {
                    background: #1565c0;
                }

                .ai-toolbar button.primary:disabled {
                    background: #bbb;
                    border-color: #bbb;
                    cursor: not-allowed;
                }

                .ai-body {
                    display: flex;
                    flex: 1;
                    min-height: 0;
                    gap: 16px;
                }

                .ai-chat-col {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    min-width: 0;
                }

                .ai-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 12px 0;
                    min-height: 0;
                }

                .ai-input-area {
                    flex-shrink: 0;
                    padding: 8px 0;
                    border-top: 1px solid #e0e0e0;
                }

                .interrupt-btn {
                    padding: 8px 16px;
                    background: #d32f2f;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.85em;
                    white-space: nowrap;
                    flex-shrink: 0;
                }

                .interrupt-btn:hover {
                    background: #b71c1c;
                }

                .consent-notice {
                    background: #fff3e0;
                    border: 1px solid #ffe0b2;
                    border-radius: 8px;
                    padding: 12px 16px;
                    margin-bottom: 12px;
                    font-size: 0.85em;
                    color: #e65100;
                }

                .readonly-banner {
                    background: #e3f2fd;
                    border: 1px solid #90caf9;
                    border-radius: 8px;
                    padding: 10px 16px;
                    margin-bottom: 8px;
                    font-size: 0.85em;
                    color: #1565c0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .back-btn {
                    padding: 6px 12px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    background: white;
                    cursor: pointer;
                    font-size: 0.85em;
                    color: #555;
                }

                .back-btn:hover {
                    background: #f5f5f5;
                }

                /* ── Todo Panel ─────────────────────────── */

                .todo-panel {
                    width: 240px;
                    flex-shrink: 0;
                    overflow-y: auto;
                    border-left: 1px solid #e0e0e0;
                    padding: 12px 0 12px 16px;
                }

                .todo-panel h4 {
                    margin: 0 0 12px;
                    font-size: 0.85em;
                    color: #555;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .phase-list {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 20px;
                }

                .phase-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 6px 0;
                    font-size: 0.85em;
                    color: #888;
                    line-height: 1.3;
                }

                .phase-item.completed {
                    color: #2e7d32;
                }

                .phase-item.active {
                    color: #1565c0;
                    font-weight: 600;
                }

                .phase-dot {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    border: 2px solid #ccc;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7em;
                    margin-top: 1px;
                }

                .phase-item.completed .phase-dot {
                    background: #2e7d32;
                    border-color: #2e7d32;
                    color: white;
                }

                .phase-item.active .phase-dot {
                    border-color: #1976d2;
                    background: #e3f2fd;
                }

                .todo-section {
                    margin-top: 8px;
                }

                .todo-section h4 {
                    margin-bottom: 8px;
                }

                .todo-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 6px;
                    padding: 3px 0;
                    font-size: 0.82em;
                    color: #555;
                    line-height: 1.4;
                }

                .todo-item.done {
                    color: #999;
                    text-decoration: line-through;
                }

                .todo-check {
                    flex-shrink: 0;
                    margin-top: 2px;
                    font-size: 0.9em;
                }

                .phase-todos {
                    margin-left: 26px;
                    padding: 2px 0 4px;
                }
            </style>

            <div class="ai-page">
                <!-- Settings Panel (collapsible) -->
                <nwbguide-ai-settings .open=${this.settingsOpen}></nwbguide-ai-settings>

                <!-- Toolbar -->
                <div class="ai-toolbar">
                    <button class="back-btn" @click=${this._backToList}>All Chats</button>

                    ${this.isReadOnly
                        ? ""
                        : html`
                              <label style="font-size: 0.85em; font-weight: 500; white-space: nowrap;">
                                  Data folder:
                              </label>
                              <input
                                  type="text"
                                  .value=${this.dataDir}
                                  @input=${(e) => (this.dataDir = e.target.value)}
                                  placeholder="/path/to/your/data"
                              />
                              <button @click=${this._browseFolder}>Browse</button>
                              <button
                                  class="primary"
                                  ?disabled=${!this.dataDir || this.connected || this._starting}
                                  @click=${this._startSession}
                              >
                                  ${this.connected ? "Connected" : this._starting ? "Connecting..." : "Start"}
                              </button>
                          `}
                    ${this.connected ? html`<button @click=${this._newConversation}>New</button>` : ""}
                    <button @click=${() => (this.settingsOpen = !this.settingsOpen)}>Settings</button>
                </div>

                ${this.isReadOnly
                    ? html`
                          <div class="readonly-banner">
                              <span>Viewing saved conversation (read-only)</span>
                          </div>
                      `
                    : ""}
                ${!this.connected && !this.isReadOnly
                    ? html`
                          <div class="consent-notice">
                              By using the AI Assistant, you agree that conversation transcripts and generated code will
                              be shared with CatalystNeuro for quality monitoring. Your data files are never uploaded.
                          </div>
                      `
                    : ""}

                <!-- Main body: chat + todo panel -->
                <div class="ai-body">
                    <!-- Chat column -->
                    <div class="ai-chat-col">
                        <div class="ai-messages" id="ai-messages">
                            ${this.messages.length === 0 && !this.connected && !this.isReadOnly
                                ? html`
                                      <div
                                          style="text-align: center; color: #888; padding: 40px 20px; font-size: 0.95em; line-height: 1.6;"
                                      >
                                          <h3 style="color: #555; margin-bottom: 8px;">NWB Conversion Assistant</h3>
                                          <p>Select your data folder above and click <b>Start</b> to begin.</p>
                                      </div>
                                  `
                                : ""}
                            ${this.messages.map(
                                (msg) =>
                                    html`<nwbguide-chat-message
                                        .message=${msg}
                                        @choice-selected=${this._onChoiceSelected}
                                    ></nwbguide-chat-message>`
                            )}
                        </div>

                        ${!this.isReadOnly
                            ? html`
                                  <div class="ai-input-area">
                                      <div style="display: flex; align-items: center; gap: 8px;">
                                          <nwbguide-chat-input
                                              style="flex: 1;"
                                              ?disabled=${!this.connected}
                                              .placeholder=${this.connected
                                                  ? this.isStreaming
                                                      ? "Type to interrupt and interject..."
                                                      : "Type your message..."
                                                  : "Start a session first..."}
                                              @send-message=${this._onSendMessage}
                                          ></nwbguide-chat-input>
                                          ${this.isStreaming
                                              ? html`<button
                                                    class="interrupt-btn"
                                                    @click=${this._interrupt}
                                                    title="Stop the agent"
                                                >
                                                    Stop
                                                </button>`
                                              : ""}
                                      </div>
                                  </div>
                              `
                            : ""}
                    </div>

                    <!-- Todo panel (right side) -->
                    <div class="todo-panel">
                        <h4>Progress</h4>
                        <ul class="phase-list">
                            ${PHASES.map((name, i) => {
                                const num = i + 1;
                                const status =
                                    num < this.currentPhase ? "completed" : num === this.currentPhase ? "active" : "";
                                const phaseTodos = this.todos.filter((t) => t.phase === num);
                                return html`
                                    <li class="phase-item ${status}">
                                        <span class="phase-dot"> ${status === "completed" ? "\u2713" : num} </span>
                                        <span>${name}</span>
                                    </li>
                                    ${phaseTodos.length > 0
                                        ? html`
                                              <div class="phase-todos">
                                                  ${phaseTodos.map(
                                                      (t) => html`
                                                          <div class="todo-item ${t.done ? "done" : ""}">
                                                              <span class="todo-check"
                                                                  >${t.done ? "\u2611" : "\u2610"}</span
                                                              >
                                                              <span>${t.text}</span>
                                                          </div>
                                                      `
                                                  )}
                                              </div>
                                          `
                                        : ""}
                                `;
                            })}
                        </ul>

                        ${this.todos.filter((t) => !t.phase).length > 0
                            ? html`
                                  <div class="todo-section">
                                      <h4>Other Items</h4>
                                      ${this.todos
                                          .filter((t) => !t.phase)
                                          .map(
                                              (t) => html`
                                                  <div class="todo-item ${t.done ? "done" : ""}">
                                                      <span class="todo-check">${t.done ? "\u2611" : "\u2610"}</span>
                                                      <span>${t.text}</span>
                                                  </div>
                                              `
                                          )}
                                  </div>
                              `
                            : ""}
                    </div>
                </div>
            </div>
        `;
    }

    _sharedStyles() {
        return css``;
    }

    // ── Actions ────────────────────────────────────────────────────────

    _showNewChat() {
        this.messages = [];
        this.sessionId = null;
        this.dataDir = "";
        this.connected = false;
        this.isStreaming = false;
        this.isReadOnly = false;
        this.currentPhase = 0;
        this.todos = [];
        this._starting = false;
        this.viewMode = "chat";
    }

    async _viewSession(sessionId) {
        try {
            const resp = await fetch(new URL(`/ai/sessions/${sessionId}`, baseUrl));
            if (!resp.ok) return;

            const data = await resp.json();
            if (data.connected) {
                // This is an active session — reconnect to it
                this.sessionId = sessionId;
                this.dataDir = data.data_dir || "";
                this.connected = true;
                this.isReadOnly = false;
                this.messages = [];
                this.currentPhase = 0;
                this.todos = [];
                this.viewMode = "chat";
                this._connectSSE();
            } else if (data.messages) {
                // Saved session — show read-only
                this.sessionId = sessionId;
                this.dataDir = data.data_dir || "";
                this.connected = false;
                this.isReadOnly = true;
                this.messages = data.messages;
                this.viewMode = "chat";
                // Rebuild phase + todo state from saved messages
                this._rebuildTodoState(data.messages);
            }
        } catch {
            // ignore
        }
    }

    async _deleteSession(e, sessionId) {
        e.stopPropagation(); // Don't trigger card click
        try {
            await fetch(new URL(`/ai/sessions/${sessionId}?delete_history=true`, baseUrl), {
                method: "DELETE",
            });
            this.savedSessions = this.savedSessions.filter((s) => s.session_id !== sessionId);
        } catch {
            // ignore
        }
    }

    _backToList() {
        // If we have an active connection, don't kill it — just go back
        if (this.connected) {
            // Keep the session alive in the background
        }
        this._closeEventSource();
        this.viewMode = "list";
        this.isReadOnly = false;
        this._loadSessions(); // refresh the list
    }

    async _browseFolder() {
        try {
            const { electron } = await import("../../../../utils/electron");
            if (electron?.ipcRenderer) {
                const result = await electron.ipcRenderer.invoke("showOpenDialog", {
                    properties: ["openDirectory"],
                    title: "Select Data Folder",
                });
                if (result && !result.canceled && result.filePaths?.length) {
                    this.dataDir = result.filePaths[0];
                    this.requestUpdate();
                }
            }
        } catch {
            // Fallback: user types the path manually
        }
    }

    async _startSession() {
        if (!this.dataDir || this.connected || this._starting) return;
        this._starting = true;
        this.requestUpdate();

        const settingsPanel = this.querySelector("nwbguide-ai-settings");
        const settings = settingsPanel?.getSettings() || {};

        try {
            const resp = await fetch(new URL("/ai/sessions", baseUrl), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data_dir: this.dataDir,
                    api_key: settings.apiKey,
                    model: settings.model,
                }),
            });

            if (!resp.ok) {
                const err = await resp.json();
                this._addMessage("error", err.message || "Failed to create session");
                this._starting = false;
                return;
            }

            const data = await resp.json();
            this.sessionId = data.session_id;

            this._connectSSE();

            await this._waitForConnection();
            this.connected = true;
            this._starting = false;
            this.currentPhase = 1; // Phase 1 starts immediately

            this._addMessage("assistant", [
                {
                    type: "text",
                    text: "Connected! I'm ready to help you convert your data to NWB. Let me start by inspecting your data directory...",
                },
            ]);

            this._sendToAgent(
                `I'd like to convert my neurophysiology data to NWB format. My data is located at: ${this.dataDir}`
            );
        } catch (e) {
            this._starting = false;
            this._addMessage("error", `Connection failed: ${e.message}`);
        }
    }

    async _waitForConnection(maxWaitMs = 30000) {
        const interval = 500;
        let elapsed = 0;
        while (elapsed < maxWaitMs) {
            try {
                const resp = await fetch(new URL(`/ai/sessions/${this.sessionId}`, baseUrl));
                if (resp.ok) {
                    const data = await resp.json();
                    if (data.connected) return;
                }
            } catch {
                // ignore fetch errors during polling
            }
            await new Promise((r) => setTimeout(r, interval));
            elapsed += interval;
        }
        throw new Error("Agent did not connect in time.");
    }

    _connectSSE() {
        if (this._eventSource) this._closeEventSource();

        const url = new URL(`/ai/sessions/${this.sessionId}/events`, baseUrl);
        this._eventSource = new EventSource(url);

        this._eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this._handleSSEEvent(data);
            } catch {
                // Ignore parse errors from keepalives
            }
        };

        this._eventSource.onerror = () => {
            // EventSource will auto-reconnect
        };
    }

    _handleSSEEvent(data) {
        if (data.type === "assistant") {
            this._mergeAssistantContent(data.content);
            this._detectPhaseTransition(data.content);
        } else if (data.type === "error") {
            this._addMessage("error", data.content);
            this.isStreaming = false;
        } else if (data.type === "result") {
            this.isStreaming = false;
            if (data.is_error) {
                this._addMessage("error", data.result || "Agent encountered an error.");
            }
        } else if (data.type === "done") {
            this.isStreaming = false;
        }

        this._scrollToBottom();
    }

    _detectPhaseTransition(content) {
        if (!Array.isArray(content)) return;

        for (const block of content) {
            // Detect phase headers from text
            if (block.type === "text") {
                const phaseMatch = block.text.match(/(?:Phase|phase)\s+(\d)[:.\s]+(.+?)(?:\n|$)/);
                if (phaseMatch) {
                    const phaseNum = parseInt(phaseMatch[1], 10);
                    if (phaseNum > this.currentPhase) {
                        this.currentPhase = phaseNum;
                    }
                    this._addMessage("phase", `Phase ${phaseMatch[1]}: ${phaseMatch[2].trim()}`);
                }

                // Parse checklist items: - [ ] todo or - [x] done
                const todoRegex = /^[-*]\s+\[([ xX])\]\s+(.+)$/gm;
                let match;
                while ((match = todoRegex.exec(block.text)) !== null) {
                    const done = match[1].toLowerCase() === "x";
                    const text = match[2].trim();
                    this._upsertTodo(text, done, this.currentPhase);
                }
            }

            // Detect TaskCreate / TodoWrite tool calls
            if (block.type === "tool_use" && (block.name === "TaskCreate" || block.name === "TodoWrite")) {
                const subject = block.input?.subject || block.input?.task || "";
                if (subject) {
                    this._upsertTodo(subject, false, this.currentPhase);
                }
            }

            // Detect TaskUpdate / TodoWrite status changes
            if (block.type === "tool_use" && (block.name === "TaskUpdate" || block.name === "TodoUpdate")) {
                const status = block.input?.status;
                const taskId = block.input?.taskId || block.input?.id;
                if (status === "completed" && taskId) {
                    // Try to mark a todo as done by matching the taskId or subject
                    // Since we don't track IDs, mark by index if it matches
                    const idx = parseInt(taskId, 10) - 1;
                    if (idx >= 0 && idx < this.todos.length) {
                        const updated = [...this.todos];
                        updated[idx] = { ...updated[idx], done: true };
                        this.todos = updated;
                    }
                }
            }
        }
    }

    _upsertTodo(text, done, phase) {
        const existing = this.todos.findIndex((t) => t.text === text);
        if (existing >= 0) {
            const updated = [...this.todos];
            updated[existing] = { ...updated[existing], done, phase: updated[existing].phase || phase };
            this.todos = updated;
        } else {
            this.todos = [...this.todos, { text, done, phase }];
        }
    }

    async _onSendMessage(e) {
        const text = e.detail;
        if (this.isStreaming) {
            await this._interrupt();
        }
        this._addMessage("user", text);
        this._sendToAgent(text);
        this._scrollToBottom();
    }

    async _onChoiceSelected(e) {
        const choice = e.detail;
        if (!this.connected) return;
        if (this.isStreaming) {
            await this._interrupt();
        }
        this._addMessage("user", choice);
        this._sendToAgent(choice);
        this._scrollToBottom();
    }

    async _interrupt() {
        if (!this.sessionId) return;
        try {
            await fetch(new URL(`/ai/sessions/${this.sessionId}/interrupt`, baseUrl), {
                method: "POST",
            });
            this.isStreaming = false;
        } catch {
            // ignore
        }
    }

    async _sendToAgent(content) {
        if (!this.sessionId) return;

        this.isStreaming = true;

        try {
            await fetch(new URL(`/ai/sessions/${this.sessionId}/message`, baseUrl), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
        } catch (e) {
            this._addMessage("error", `Failed to send message: ${e.message}`);
            this.isStreaming = false;
        }
    }

    _mergeAssistantContent(content) {
        if (!Array.isArray(content)) {
            this._addMessage("assistant", content);
            return;
        }

        const hasOnlyResults = content.every((b) => b.type === "tool_result");

        if (hasOnlyResults) {
            const updated = [...this.messages];
            for (let i = updated.length - 1; i >= 0; i--) {
                const msg = updated[i];
                if (msg.role === "assistant" && Array.isArray(msg.content)) {
                    const hasToolUse = msg.content.some((b) => b.type === "tool_use");
                    if (hasToolUse) {
                        updated[i] = { ...msg, content: [...msg.content, ...content] };
                        this.messages = updated;
                        return;
                    }
                }
            }
        }

        this._addMessage("assistant", content);
    }

    _addMessage(role, content) {
        this.messages = [...this.messages, { role, content }];
    }

    _scrollToBottom() {
        requestAnimationFrame(() => {
            const container = this.querySelector("#ai-messages");
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        });
    }

    async _newConversation() {
        if (this.sessionId) {
            try {
                await fetch(new URL(`/ai/sessions/${this.sessionId}`, baseUrl), {
                    method: "DELETE",
                });
            } catch {
                // ignore
            }
        }
        this._closeEventSource();

        this.messages = [];
        this.sessionId = null;
        this.connected = false;
        this.isStreaming = false;
        this.isReadOnly = false;
        this.currentPhase = 0;
        this.todos = [];
        this._starting = false;
        this.viewMode = "list";
        this._loadSessions();
    }

    _closeEventSource() {
        if (this._eventSource) {
            this._eventSource.close();
            this._eventSource = null;
        }
    }

    _rebuildTodoState(messages) {
        let phase = 1; // Phase 1 is active from the start
        const todoMap = new Map(); // text -> { done, phase }

        for (const msg of messages) {
            if (msg.role !== "assistant" || !Array.isArray(msg.content)) continue;

            for (const block of msg.content) {
                if (block.type === "text") {
                    // Phases
                    const phaseMatch = block.text.match(/(?:Phase|phase)\s+(\d)[:.\s]+(.+?)(?:\n|$)/);
                    if (phaseMatch) {
                        const num = parseInt(phaseMatch[1], 10);
                        if (num > phase) phase = num;
                    }

                    // Checklist items
                    const todoRegex = /^[-*]\s+\[([ xX])\]\s+(.+)$/gm;
                    let m;
                    while ((m = todoRegex.exec(block.text)) !== null) {
                        const done = m[1].toLowerCase() === "x";
                        const text = m[2].trim();
                        const prev = todoMap.get(text);
                        todoMap.set(text, { done, phase: prev?.phase || phase });
                    }
                }

                // TaskCreate / TodoWrite tool calls
                if (block.type === "tool_use" && (block.name === "TaskCreate" || block.name === "TodoWrite")) {
                    const subject = block.input?.subject || block.input?.task || "";
                    if (subject) {
                        const prev = todoMap.get(subject);
                        todoMap.set(subject, { done: prev?.done || false, phase: prev?.phase || phase });
                    }
                }
            }
        }

        this.currentPhase = phase;
        this.todos = [...todoMap.entries()].map(([text, { done, phase: p }]) => ({ text, done, phase: p }));
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    _formatDate(isoStr) {
        if (!isoStr) return "";
        try {
            const d = new Date(isoStr);
            const now = new Date();
            const diffMs = now - d;
            const diffMin = Math.floor(diffMs / 60000);
            const diffHr = Math.floor(diffMs / 3600000);
            const diffDay = Math.floor(diffMs / 86400000);

            if (diffMin < 1) return "just now";
            if (diffMin < 60) return `${diffMin}m ago`;
            if (diffHr < 24) return `${diffHr}h ago`;
            if (diffDay < 7) return `${diffDay}d ago`;
            return d.toLocaleDateString();
        } catch {
            return "";
        }
    }

    _shortDir(dirPath) {
        if (!dirPath) return "";
        const parts = dirPath.split("/").filter(Boolean);
        return parts.length > 2 ? ".../" + parts.slice(-2).join("/") : dirPath;
    }
}

customElements.get("nwbguide-ai-assistant-page") ||
    customElements.define("nwbguide-ai-assistant-page", AIAssistantPage);
