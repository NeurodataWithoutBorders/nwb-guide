import { LitElement, css, html } from "lit";

import { fs, remote } from "../electron/index";
import { List } from "./List";
const { dialog } = remote;

import restartSVG from "../../assets/icons/restart.svg?raw";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";

function getObjectTypeReferenceString(type, multiple, { nested, native } = {}) {
    if (Array.isArray(type))
        return `${multiple ? "" : "a "}${type
            .map((type) => getObjectTypeReferenceString(type, multiple, { native, nested: true }))
            .join(" / ")}`;

    const isDir = type === "directory";
    return multiple && (!isDir || (isDir && !native) || dialog)
        ? type === "directory"
            ? "directories"
            : "files"
        : nested
          ? type
          : `a ${type}`;
}

const componentCSS = css`
    * {
        box-sizing: border-box;
    }

    :host {
        display: inline-block;
        position: relative;
        width: 100%;
    }

    :host([manytypes="true"]) > button {
        cursor: default;
    }

    nwb-list {
        width: 100px;
    }

    #button-div {
        margin-top: 10px;
        display: flex;
        gap: 5px;
    }

    #button-div > nwb-button {
        margin-bottom: 10px;
    }

    button {
        background: WhiteSmoke;
        border: 1px solid #c3c3c3;
        border-radius: 4px;
        padding: 25px;
        width: 100%;
        color: dimgray;
        cursor: pointer;
        overflow-wrap: break-word;
        text-align: center;
        transition: background 0.5s;
    }

    small {
        color: silver;
    }

    :host(.active) button {
        background: rgb(240, 240, 240);
    }

    .controls {
        position: absolute;
        right: 0;
        bottom: 0;
        cursor: pointer;
        padding: 0px 5px;
    }
`;

document.addEventListener("dragover", (dragOverEvent) => {
    dragOverEvent.preventDefault();
    dragOverEvent.stopPropagation();
});

export class FilesystemSelector extends LitElement {
    static get styles() {
        return componentCSS;
    }

    static get properties() {
        return {
            value: { type: String, reflect: true },
        };
    }

    constructor(props = {}) {
        super();
        if (props.onSelect) this.onSelect = props.onSelect;
        if (props.onChange) this.onChange = props.onChange;
        if (props.onThrow) this.onThrow = props.onThrow;

        this.accept = props.accept;
        this.multiple = props.multiple;
        this.type = props.type ?? "file";
        this.value = props.value ?? "";
        this.dialogOptions = props.dialogOptions ?? {};
        this.onChange = props.onChange ?? (() => {});
        this.dialogType = props.dialogType ?? "showOpenDialog";

        this.addEventListener("change", () => this.onChange(this.value));
    }

    onSelect = () => {};
    onChange = () => {};
    #onThrow = (title, message) => {
        message = message ? `<h5 style="margin-bottom: 0;">${title}</h5> <small>${message}</small>` : title;
        if (this.onThrow) this.onThrow(message);
        throw new Error(message);
    };

    display = document.createElement("small");

    #useElectronDialog = async (type) => {
        const options = { ...this.dialogOptions };

        if (!options.filters && this.accept) {
            options.filters = [
                {
                    name: "Suggested Files",
                    extensions: this.accept.map((ext) => (ext[0] === "." ? ext.slice(1) : ext)),
                },
                { name: "All Files", extensions: ["*"] },
            ];
        }

        options.properties = [
            type === "file" ? "openFile" : "openDirectory",
            "noResolveAliases",
            ...(options.properties ?? []),
        ];

        if (this.multiple && !options.properties.includes("multiSelections"))
            options.properties.push("multiSelections");

        this.classList.add("active");
        const result = await dialog[this.dialogType](options);

        this.classList.remove("active");
        if (result.canceled) return [];
        return result;
    };

    #check = (value) => {
        // Check type
        const isLikelyFile = fs ? fs.statSync(value).isFile() : value.split(".").length;
        if ((this.type === "directory" && isLikelyFile) || (this.type === "file" && !isLikelyFile))
            this.#onThrow("Incorrect filesystem object", `Please provide a <b>${this.type}</b> instead.`);
    };

    #handleFiles = async (pathOrPaths, type) => {
        const resolvedType = type ?? this.type;

        if (pathOrPaths) {
            if (Array.isArray(pathOrPaths)) pathOrPaths.forEach(this.#check);
            else if (!type) this.#check(pathOrPaths);
        }

        let resolvedValue = pathOrPaths;

        if (Array.isArray(resolvedValue) && !this.multiple) {
            if (resolvedValue.length > 1)
                this.#onThrow(
                    `Too many ${resolvedType === "directory" ? "directories" : "files"} detected`,
                    `This selector will only accept one.`
                );
            resolvedValue = resolvedValue[0];
        }

        if (this.multiple && !Array.isArray(resolvedValue)) resolvedValue = [];

        this.value = resolvedValue;
        this.onSelect(this.value);
        const event = new Event("change"); // Create a new change event
        this.dispatchEvent(event);
    };

    async selectFormat(type = this.type) {
        if (dialog) {
            const results = await this.#useElectronDialog(type);
            // const path = file.filePath ?? file.filePaths?.[0];
            const resolved = results.filePath ?? results.filePaths;
            if (!resolved) return; // Cancelled
            this.#handleFiles(results.filePath ?? results.filePaths, type);
        } else {
            let handles = await (
                type === "directory"
                    ? window.showDirectoryPicker()
                    : window.showOpenFilePicker({ multiple: this.multiple })
            ).catch(() => []); // Call using the same options

            const result = Array.isArray(handles) ? handles.map(({ name }) => name) : handles.name;
            if (!result) return; // Cancelled

            this.#handleFiles(result, type);
        }
    }

    render() {
        const isMultipleTypes = Array.isArray(this.type);
        this.setAttribute("manytypes", isMultipleTypes);
        const isArray = Array.isArray(this.value);

        const len = isArray ? this.value.length : 0;

        const resolvedValueDisplay = isArray
            ? len > 1
                ? `${this.value[0]} and ${len - 1} other${len > 2 ? "s" : ""}`
                : this.value[0]
            : this.value;

        const objectTypeReference = getObjectTypeReferenceString(this.type, this.multiple);

        const instanceThis = this;

        return html`
            <div>
                <button
                    title=${isArray ? this.value.map((v, i) => `${i + 1}. ${v}`).join("\n") : this.value}
                    @click=${() => isMultipleTypes || this.selectFormat()}
                    @dragenter=${() => {
                        this.classList.add("active");
                    }}
                    @dragleave=${() => {
                        this.classList.remove("active");
                    }}
                    @drop=${async (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        this.classList.remove("active");

                        let pathArr = [];
                        for (const f of event.dataTransfer.files) pathArr.push(f.path ?? f.name);
                        this.#handleFiles(pathArr);
                    }}
                >
                    ${resolvedValueDisplay
                        ? html`
                              ${resolvedValueDisplay}
                              ${dialog
                                  ? ""
                                  : html`<br /><small
                                            >Cannot get full ${isMultipleTypes ? this.type.join(" / ") : this.type}
                                            path${this.multiple ? "s" : ""} on web distribution</small
                                        >`}
                          `
                        : html`<span
                                  >Drop ${objectTypeReference}
                                  here${isMultipleTypes
                                      ? ""
                                      : `, or click to choose ${getObjectTypeReferenceString(this.type, this.multiple, {
                                            native: true,
                                        })}`}</span
                              >${this.multiple &&
                              (this.type === "directory" ||
                                  (isMultipleTypes && this.type.includes("directory") && !dialog))
                                  ? html`<br /><small
                                            >Multiple directory support only available using drag-and-drop.</small
                                        >`
                                  : ""}`}
                </button>
                ${this.multiple && isArray && this.value.length > 1
                    ? new List({
                          items: this.value.map((v) => ({ value: v })),
                          editable: false,
                          onChange: function () {
                              instanceThis.value = this.items.map((item) => item.value);
                          },
                      })
                    : ""}

                <div class="controls">
                    ${this.value ? html`<div @click=${() => this.#handleFiles()}>${unsafeSVG(restartSVG)}</div>` : ""}
                </div>
            </div>
            ${isMultipleTypes
                ? html`<div id="button-div">
                      ${this.type.map(
                          (type) =>
                              html`<nwb-button primary @click=${() => this.selectFormat(type)}
                                  >Select
                                  ${getObjectTypeReferenceString(type, this.multiple, { native: true })}</nwb-button
                              >`
                      )}
                  </div>`
                : ""}
        `;
    }
}

customElements.get("filesystem-selector") || customElements.define("filesystem-selector", FilesystemSelector);
