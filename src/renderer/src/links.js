import { electron } from "./electron/index.js";
const { shell } = electron;

export const openLink = (url) => {
    if (shell) shell.openExternal(url);
    else window.open(url, "_blank");
};
