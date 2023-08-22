import { html } from "lit";
import { JSONSchemaForm } from "../../JSONSchemaForm.js";
import { Page } from "../Page.js";
import { onThrow } from "../../../errors";
import dandiUploadSchema from "../../../../../../schemas/json/dandi_upload_schema.json";
import { JSONSchemaInput } from "../../JSONSchemaInput.js";
import { Button } from "../../Button.js";
import { get, getEntries, updateFile, global } from "../../../progress.js";
import { merge } from "../utils.js";

import { remote } from "../../../electron/index";
import { run } from "../guided-mode/options/utils.js";
const { dialog } = remote;

export class UploadsPage extends Page {
    constructor(...args) {
        super(...args);
    }

    getCustomFolderInfo = (folder) => {
        return { upload: { info: { nwb_folder_path: folder } } };
    };

    render() {
        let latestProjectInfo;
        const globalState = (global.data.uploads = global.data.uploads ?? {});

        const customFolderOption = "Select a custom folder";
        const projectPrefix = "Project: ";
        const defaultButtonMessage = "Upload Files";

        let options = getEntries()
            .map((str) => str.slice(0, -5))
            .map((str) => projectPrefix + str);
        options = [customFolderOption, ...options];

        const customFolderDisplay = document.createElement("small");
        customFolderDisplay.style.color = "gray";

        const reloading = "project" in globalState;
        const reloadingCustomFolder = globalState.project === customFolderOption;

        if (reloadingCustomFolder) customFolderDisplay.innerText = globalState.nwb_folder_path;

        const button = new Button({
            label: defaultButtonMessage,
            onClick: async () => {
                await this.form.validate(); // Will throw an error in the callback

                merge({ upload: { info: this.form.resolved } }, latestProjectInfo); // Merge the local and global states

                const { upload, project } = latestProjectInfo;
                const info = upload.info ?? (upload.info = {});
                if (project) info.project = project.name;
                info.staging = parseInt(info.dandiset_id) >= 100000; // Automatically detect staging IDs

                const results = await run("upload", info, { title: "Uploading to DANDI" }).catch((e) => {
                    this.notify(e.message, "error");
                    throw e;
                });

                upload.results = results; // Save the preview results

                updateFile(globalState.project.name, () => latestProjectInfo);
            },
        });

        if (reloading)
            latestProjectInfo = reloadingCustomFolder
                ? this.getCustomFolderInfo((customFolderDisplay.innerText = globalState.nwb_folder_path))
                : get(globalState.project);
        else button.disabled = true;

        const input = new JSONSchemaInput({
            value: globalState.project,
            path: ["Project"],
            info: {
                type: "string",
                placeholder: "Select a project to upload",
                enum: options,
            },
            onUpdate: async (value) => {
                if (value) {
                    globalState.project = value;

                    if (value === "Select a custom folder") {
                        const result = await dialog["showOpenDialog"]({ properties: ["openDirectory"] });
                        if (result.canceled) throw new Error("No file selected");

                        const folder =
                            (globalState.nwb_folder_path =
                            customFolderDisplay.innerText =
                                result.filePath ?? result.filePaths?.[0]);
                        latestProjectInfo = this.getCustomFolderInfo(folder);
                    } else {
                        delete globalState.nwb_folder_path;
                        customFolderDisplay.innerText = "";
                        latestProjectInfo = get(value.slice(projectPrefix.length));
                    }

                    const upload = latestProjectInfo.upload ?? (latestProjectInfo.upload = {});
                    button.label = upload.results ? "Reupload Files" : defaultButtonMessage;
                    button.disabled = false;
                } else {
                    button.disabled = true;
                    delete globalState.project;
                }

                global.save();
            },
        });

        // NOTE: API Keys and Dandiset IDs persist across selected project
        this.form = new JSONSchemaForm({
            results: globalState,
            schema: dandiUploadSchema,
            onUpdate: () => global.save(),
            onThrow,
        });

        return html`
            <div style="display: flex; align-items: end; justify-content: space-between; margin-bottom: 10px;">
                <h1 style="margin: 0;">DANDI Uploads</h1>
            </div>
            <p>This page allows you to upload projects with converted files to the DANDI Archive.</p>
            <hr />

            <div>
                ${input} ${customFolderDisplay}
                <hr />
                ${this.form}
                <hr />
                ${button}
            </div>
        `;
    }
}

customElements.get("nwbguide-uploads-page") || customElements.define("nwbguide-uploads-page", UploadsPage);
