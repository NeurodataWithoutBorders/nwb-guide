import { LitElement, html, css } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { marked } from "marked";

/**
 * Renders a single chat message (user, assistant, or tool-use).
 *
 * @property {Object} message - The message object with `role` and `content`.
 *   role: "user" | "assistant" | "phase" | "error"
 *   content: string | Array<{type, text?, name?, input?, content?}>
 */
export class ChatMessage extends LitElement {
    static properties = {
        message: { type: Object },
    };

    static styles = css`
        :host {
            display: block;
            margin-bottom: 12px;
        }

        .message {
            padding: 10px 14px;
            border-radius: 8px;
            max-width: 85%;
            line-height: 1.5;
            word-wrap: break-word;
        }

        .user {
            background: #e3f2fd;
            margin-left: auto;
            text-align: right;
            border-bottom-right-radius: 2px;
            white-space: pre-wrap;
        }

        .assistant {
            background: #f5f5f5;
            margin-right: auto;
            border-bottom-left-radius: 2px;
        }

        .error {
            background: #ffebee;
            color: #c62828;
            margin-right: auto;
            border-bottom-left-radius: 2px;
        }

        .phase-divider {
            text-align: center;
            color: #666;
            font-size: 0.85em;
            font-weight: 600;
            padding: 8px 0;
            border-top: 1px solid #e0e0e0;
            border-bottom: 1px solid #e0e0e0;
            margin: 8px 0;
        }

        .tool-card {
            background: #fafafa;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 4px 10px;
            margin: 2px 0;
            font-size: 0.85em;
        }

        .tool-card summary {
            cursor: pointer;
            font-weight: 500;
            color: #555;
        }

        .tool-card pre {
            margin: 2px 0 4px;
            padding: 6px;
            background: #f0f0f0;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 0.9em;
            max-height: 200px;
            overflow-y: auto;
        }

        .tool-card pre.tool-error {
            background: #ffebee;
            color: #c62828;
        }

        .tool-summary {
            color: #888;
            font-weight: 400;
        }

        .tool-error-badge {
            color: #c62828;
            font-size: 0.8em;
            font-weight: 600;
        }

        .tool-name {
            font-weight: 600;
            color: #555;
        }

        .tool-code {
            margin: 2px 0 4px;
            padding: 6px 8px;
            background: #f8f8f8;
            color: #1a1a1a;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 0.9em;
            max-height: 200px;
            overflow-y: auto;
        }

        .tool-code .hl-kw {
            color: #8839ef;
        }
        .tool-code .hl-bi {
            color: #d20f39;
        }
        .tool-code .hl-str {
            color: #40a02b;
        }
        .tool-code .hl-num {
            color: #fe640b;
        }
        .tool-code .hl-cmt {
            color: #8c8fa1;
            font-style: italic;
        }
        .tool-code .hl-op {
            color: #1a1a1a;
        }
        .tool-code .hl-dec {
            color: #e64553;
        }
        .tool-code .hl-cls {
            color: #1e66f5;
        }

        .tool-diff {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .tool-diff-old {
            margin: 2px 0;
            padding: 4px 8px;
            background: #ffeef0;
            color: #b31d28;
            border-radius: 4px;
            font-size: 0.9em;
            max-height: 150px;
            overflow: auto;
            border-left: 3px solid #d73a49;
        }

        .tool-diff-new {
            margin: 2px 0;
            padding: 4px 8px;
            background: #e6ffed;
            color: #22863a;
            border-radius: 4px;
            font-size: 0.9em;
            max-height: 150px;
            overflow: auto;
            border-left: 3px solid #28a745;
        }

        .tool-section-label {
            font-size: 0.75em;
            color: #999;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .text-block {
            line-height: 1.5;
        }

        .text-block p {
            margin: 0.4em 0;
        }

        .text-block p:first-child {
            margin-top: 0;
        }

        .text-block p:last-child {
            margin-bottom: 0;
        }

        .text-block code {
            background: #e8e8e8;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 0.9em;
        }

        .text-block pre {
            background: #f8f8f8;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            padding: 6px 8px;
            overflow-x: auto;
            font-size: 0.9em;
            max-height: 200px;
            overflow-y: auto;
        }

        .text-block pre code {
            background: none;
            padding: 0;
        }

        .text-block ul,
        .text-block ol {
            margin: 0.4em 0;
            padding-left: 1.5em;
        }

        .text-block li {
            margin: 0.2em 0;
        }

        .text-block h1,
        .text-block h2,
        .text-block h3,
        .text-block h4 {
            margin: 0.6em 0 0.3em;
            line-height: 1.3;
        }

        .text-block h1 {
            font-size: 1.2em;
        }
        .text-block h2 {
            font-size: 1.1em;
        }
        .text-block h3 {
            font-size: 1em;
        }

        .text-block blockquote {
            border-left: 3px solid #ccc;
            margin: 0.4em 0;
            padding: 0.2em 0.8em;
            color: #555;
        }

        .text-block table {
            border-collapse: collapse;
            margin: 0.4em 0;
            font-size: 0.9em;
        }

        .text-block th,
        .text-block td {
            border: 1px solid #ddd;
            padding: 4px 8px;
        }

        .text-block th {
            background: #f0f0f0;
            font-weight: 600;
        }

        .text-block a {
            color: #1976d2;
        }

        .text-block strong {
            font-weight: 600;
        }

        .label {
            font-size: 0.75em;
            color: #888;
            margin-bottom: 4px;
            font-weight: 500;
        }

        .choices {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 8px 0 4px;
        }

        .choice-btn {
            padding: 8px 16px;
            border: 1px solid #90caf9;
            border-radius: 20px;
            background: #e3f2fd;
            color: #1565c0;
            cursor: pointer;
            font-size: 0.88em;
            line-height: 1.4;
            transition:
                background 0.15s,
                border-color 0.15s;
            text-align: left;
        }

        .choice-btn:hover {
            background: #bbdefb;
            border-color: #42a5f5;
        }

        .choice-btn:active {
            background: #90caf9;
        }

        .choices-answered .choice-btn {
            opacity: 0.5;
            cursor: default;
            pointer-events: none;
        }

        .choices-answered .choice-btn.selected {
            opacity: 1;
            background: #1976d2;
            color: white;
            border-color: #1976d2;
        }
    `;

    render() {
        const { role, content } = this.message || {};

        if (role === "phase") {
            return html`<div class="phase-divider">${content}</div>`;
        }

        if (role === "error") {
            return html`
                <div class="label">Error</div>
                <div class="message error">${content}</div>
            `;
        }

        if (role === "user") {
            return html` <div class="message user">${content}</div> `;
        }

        // Assistant message — content is an array of blocks
        if (role === "assistant" && Array.isArray(content)) {
            // Build a map of tool_use_id -> tool_result for pairing
            const resultMap = {};
            for (const block of content) {
                if (block.type === "tool_result") {
                    resultMap[block.tool_use_id] = block;
                }
            }
            return html`
                <div class="message assistant">
                    ${content
                        .filter((block) => block.type !== "tool_result")
                        .map((block) => this._renderBlock(block, resultMap))}
                </div>
            `;
        }

        // Fallback for plain text assistant
        return html` <div class="message assistant">${content}</div> `;
    }

    _renderBlock(block, resultMap = {}) {
        if (block.type === "text") {
            // Check for <choices> blocks
            const choicesMatch = block.text.match(/<choices>([\s\S]*?)<\/choices>/);
            if (choicesMatch) {
                const textBefore = block.text.slice(0, choicesMatch.index).trim();
                const textAfter = block.text.slice(choicesMatch.index + choicesMatch[0].length).trim();
                const options = this._parseChoices(choicesMatch[1]);

                return html`
                    ${textBefore
                        ? html`<div class="text-block">${unsafeHTML(this._renderMarkdown(textBefore))}</div>`
                        : ""}
                    <div class="choices ${block._answered ? "choices-answered" : ""}">
                        ${options.map(
                            (opt) => html`
                                <button
                                    class="choice-btn ${block._selectedChoice === opt ? "selected" : ""}"
                                    @click=${() => this._onChoiceClick(opt, block)}
                                >
                                    ${opt}
                                </button>
                            `
                        )}
                    </div>
                    ${textAfter
                        ? html`<div class="text-block">${unsafeHTML(this._renderMarkdown(textAfter))}</div>`
                        : ""}
                `;
            }

            return html`<div class="text-block">${unsafeHTML(this._renderMarkdown(block.text))}</div>`;
        }

        if (block.type === "tool_use") {
            const result = resultMap[block.id];
            const resultPreview = result
                ? typeof result.content === "string"
                    ? result.content.slice(0, 2000)
                    : JSON.stringify(result.content).slice(0, 2000)
                : null;

            return html`
                <details class="tool-card">
                    <summary>
                        ${this._renderToolSummary(block)}
                        ${result?.is_error ? html` <span class="tool-error-badge">error</span>` : ""}
                    </summary>
                    ${this._renderToolInput(block)}
                    ${resultPreview != null
                        ? html`
                              <div class="tool-section-label">Output</div>
                              <pre class="${result?.is_error ? "tool-error" : ""}">${resultPreview}</pre>
                          `
                        : ""}
                </details>
            `;
        }

        return html``;
    }

    _renderToolSummary(block) {
        const { name, input } = block;
        if (!input) return name;

        if (name === "Bash") {
            const cmd = input.command || "";
            // Show first line or first 80 chars
            const firstLine = cmd.split("\n")[0].slice(0, 80);
            return html`<span class="tool-name">$</span>
                <span class="tool-summary">${firstLine}${cmd.length > 80 || cmd.includes("\n") ? "..." : ""}</span>`;
        }
        if (name === "Read")
            return html`<span class="tool-name">Read</span>
                <span class="tool-summary">${this._shortPath(input.file_path)}</span>`;
        if (name === "Write")
            return html`<span class="tool-name">Write</span>
                <span class="tool-summary">${this._shortPath(input.file_path)}</span>`;
        if (name === "Edit")
            return html`<span class="tool-name">Edit</span>
                <span class="tool-summary">${this._shortPath(input.file_path)}</span>`;
        if (name === "Glob")
            return html`<span class="tool-name">Glob</span> <span class="tool-summary">${input.pattern}</span>`;
        if (name === "Grep")
            return html`<span class="tool-name">Grep</span> <span class="tool-summary">${input.pattern}</span>`;
        return name;
    }

    _renderToolInput(block) {
        const { name, input } = block;
        if (!input) return html``;

        if (name === "Bash") {
            const code = input.command || "";
            return html`<pre class="tool-code">${unsafeHTML(this._highlightCode(code, "shell"))}</pre>`;
        }

        if (name === "Write") {
            const content = input.content || "";
            const snippet = content.slice(0, 2000) + (content.length > 2000 ? "\n..." : "");
            const lang = this._detectLang(snippet, input.file_path);
            return html`
                <div class="tool-section-label">${this._shortPath(input.file_path)}</div>
                <pre class="tool-code">${unsafeHTML(this._highlightCode(snippet, lang))}</pre>
            `;
        }

        if (name === "Edit") {
            const lang = this._detectLang(input.new_string || "", input.file_path);
            return html`
                <div class="tool-section-label">${this._shortPath(input.file_path)}</div>
                <div class="tool-diff">
                    <pre class="tool-diff-old">${unsafeHTML(this._highlightCode(input.old_string || "", lang))}</pre>
                    <pre class="tool-diff-new">${unsafeHTML(this._highlightCode(input.new_string || "", lang))}</pre>
                </div>
            `;
        }

        // Default: show as JSON
        return html`<pre>${JSON.stringify(input, null, 2)}</pre>`;
    }

    _detectLang(code, filePath = "") {
        if (filePath.endsWith(".py") || filePath.endsWith(".pyi")) return "python";
        if (filePath.endsWith(".js") || filePath.endsWith(".ts")) return "js";
        if (filePath.endsWith(".yml") || filePath.endsWith(".yaml")) return "yaml";
        // Detect from content
        if (/^python3?\s|^#!.*python|^\s*(import |from |def |class )/.test(code)) return "python";
        if (/^\s*(const |let |var |function |import )/.test(code)) return "js";
        return "shell";
    }

    _highlightCode(code, lang = "shell") {
        // Single-pass tokenizer — avoids nested regex issues
        const tokens = this._tokenize(code, lang);
        return tokens
            .map(([type, text]) => {
                const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                if (type === "plain") return esc;
                return `<span class="hl-${type}">${esc}</span>`;
            })
            .join("");
    }

    _tokenize(code, lang) {
        const PY_KW = new Set([
            "False",
            "None",
            "True",
            "and",
            "as",
            "assert",
            "async",
            "await",
            "break",
            "class",
            "continue",
            "def",
            "del",
            "elif",
            "else",
            "except",
            "finally",
            "for",
            "from",
            "global",
            "if",
            "import",
            "in",
            "is",
            "lambda",
            "nonlocal",
            "not",
            "or",
            "pass",
            "raise",
            "return",
            "try",
            "while",
            "with",
            "yield",
        ]);
        const PY_BI = new Set([
            "print",
            "len",
            "range",
            "type",
            "int",
            "str",
            "float",
            "list",
            "dict",
            "set",
            "tuple",
            "open",
            "super",
            "isinstance",
            "hasattr",
            "getattr",
            "setattr",
            "enumerate",
            "zip",
            "map",
            "filter",
            "sorted",
            "reversed",
            "any",
            "all",
            "min",
            "max",
            "sum",
            "abs",
            "round",
            "input",
            "format",
            "id",
            "hex",
            "oct",
            "bin",
            "chr",
            "ord",
            "repr",
            "hash",
            "dir",
            "vars",
            "globals",
            "locals",
            "staticmethod",
            "classmethod",
            "property",
            "Path",
            "Union",
        ]);
        const JS_KW = new Set([
            "const",
            "let",
            "var",
            "function",
            "return",
            "if",
            "else",
            "for",
            "while",
            "do",
            "switch",
            "case",
            "break",
            "continue",
            "new",
            "this",
            "class",
            "extends",
            "import",
            "export",
            "from",
            "default",
            "async",
            "await",
            "try",
            "catch",
            "finally",
            "throw",
            "typeof",
            "instanceof",
            "of",
            "in",
            "yield",
        ]);
        const JS_BI = new Set([
            "console",
            "document",
            "window",
            "Array",
            "Object",
            "String",
            "Number",
            "Boolean",
            "Map",
            "Set",
            "Promise",
            "JSON",
            "Math",
            "Date",
            "Error",
            "RegExp",
            "parseInt",
            "parseFloat",
            "setTimeout",
            "setInterval",
            "fetch",
            "require",
        ]);
        const SH_KW = new Set([
            "if",
            "then",
            "else",
            "elif",
            "fi",
            "for",
            "do",
            "done",
            "while",
            "until",
            "case",
            "esac",
            "function",
            "in",
            "export",
            "source",
            "alias",
            "cd",
            "echo",
            "exit",
            "pwd",
            "read",
            "set",
            "unset",
            "local",
            "readonly",
            "declare",
            "eval",
            "exec",
            "trap",
            "wait",
            "kill",
            "test",
            "true",
            "false",
        ]);

        const kw = lang === "python" ? PY_KW : lang === "js" ? JS_KW : SH_KW;
        const bi = lang === "python" ? PY_BI : lang === "js" ? JS_BI : new Set();

        const tokens = [];
        let i = 0;
        const len = code.length;

        while (i < len) {
            const ch = code[i];
            const rest = code.slice(i);

            // Comments
            if (ch === "#" && lang !== "js") {
                const end = code.indexOf("\n", i);
                const cmt = end === -1 ? code.slice(i) : code.slice(i, end);
                tokens.push(["cmt", cmt]);
                i += cmt.length;
                continue;
            }
            if (lang === "js" && rest.startsWith("//")) {
                const end = code.indexOf("\n", i);
                const cmt = end === -1 ? code.slice(i) : code.slice(i, end);
                tokens.push(["cmt", cmt]);
                i += cmt.length;
                continue;
            }
            if (lang === "js" && rest.startsWith("/*")) {
                const end = code.indexOf("*/", i + 2);
                const cmt = end === -1 ? code.slice(i) : code.slice(i, end + 2);
                tokens.push(["cmt", cmt]);
                i += cmt.length;
                continue;
            }

            // Triple-quoted strings (Python)
            if (lang === "python" && (rest.startsWith('"""') || rest.startsWith("'''"))) {
                const q = rest.slice(0, 3);
                const end = code.indexOf(q, i + 3);
                const s = end === -1 ? code.slice(i) : code.slice(i, end + 3);
                tokens.push(["str", s]);
                i += s.length;
                continue;
            }

            // Strings
            if (ch === '"' || ch === "'" || (ch === "`" && lang === "js")) {
                // Check for f-string prefix
                let start = i;
                if (lang === "python" && i > 0 && (code[i - 1] === "f" || code[i - 1] === "r" || code[i - 1] === "b")) {
                    // Already consumed the prefix as part of a word — handled below
                }
                const quote = ch;
                let j = i + 1;
                while (j < len) {
                    if (code[j] === "\\") {
                        j += 2;
                        continue;
                    }
                    if (code[j] === quote) {
                        j++;
                        break;
                    }
                    j++;
                }
                tokens.push(["str", code.slice(i, j)]);
                i = j;
                continue;
            }

            // f/r/b string prefixes (Python)
            if (
                lang === "python" &&
                (ch === "f" || ch === "r" || ch === "b") &&
                i + 1 < len &&
                (code[i + 1] === '"' || code[i + 1] === "'")
            ) {
                const quote = code[i + 1];
                // Check triple
                if (i + 3 < len && code[i + 2] === quote && code[i + 3] === quote) {
                    // Prefixed triple quote -- skip for simplicity, rare
                }
                let j = i + 2;
                while (j < len) {
                    if (code[j] === "\\") {
                        j += 2;
                        continue;
                    }
                    if (code[j] === quote) {
                        j++;
                        break;
                    }
                    j++;
                }
                tokens.push(["str", code.slice(i, j)]);
                i = j;
                continue;
            }

            // Decorators (Python)
            if (lang === "python" && ch === "@" && (i === 0 || code[i - 1] === "\n")) {
                const end = code.indexOf("\n", i);
                const dec = end === -1 ? code.slice(i) : code.slice(i, end);
                tokens.push(["dec", dec]);
                i += dec.length;
                continue;
            }

            // Numbers
            if (/\d/.test(ch) && (i === 0 || !/\w/.test(code[i - 1]))) {
                let j = i;
                while (j < len && /[\d.eE_xXoObBaAfF+-]/.test(code[j])) j++;
                tokens.push(["num", code.slice(i, j)]);
                i = j;
                continue;
            }

            // Words (keywords, builtins, identifiers)
            if (/[a-zA-Z_]/.test(ch)) {
                let j = i;
                while (j < len && /\w/.test(code[j])) j++;
                const word = code.slice(i, j);
                if (kw.has(word)) tokens.push(["kw", word]);
                else if (bi.has(word)) tokens.push(["bi", word]);
                else tokens.push(["plain", word]);
                i = j;
                continue;
            }

            // Everything else
            tokens.push(["plain", ch]);
            i++;
        }

        return tokens;
    }

    _parseChoices(raw) {
        // Parse <choice>...</choice> tags, or fall back to line-based parsing
        const tagMatches = [...raw.matchAll(/<choice>([\s\S]*?)<\/choice>/g)];
        if (tagMatches.length > 0) {
            return tagMatches.map((m) => m[1].trim()).filter(Boolean);
        }
        // Fall back: each non-empty line is a choice (strip leading - or *)
        return raw
            .split("\n")
            .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
            .filter(Boolean);
    }

    _onChoiceClick(option, block) {
        if (block._answered) return;
        block._answered = true;
        block._selectedChoice = option;
        this.requestUpdate();
        this.dispatchEvent(
            new CustomEvent("choice-selected", {
                detail: option,
                bubbles: true,
                composed: true,
            })
        );
    }

    _renderMarkdown(text) {
        return marked.parse(text, { breaks: true, gfm: true });
    }

    _shortPath(filePath) {
        if (!filePath) return "";
        const parts = filePath.split("/");
        return parts.length > 3 ? ".../" + parts.slice(-3).join("/") : filePath;
    }
}

customElements.get("nwbguide-chat-message") || customElements.define("nwbguide-chat-message", ChatMessage);
