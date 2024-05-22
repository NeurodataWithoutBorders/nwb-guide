import { path } from "./electron/index.js";

import supportedInterfaces from "../../../supported_interfaces.json" assert { type: "json" };

export const joinPath = (...args) => (path ? path.join(...args) : args.filter((str) => str).join("/"));

export let runOnLoad = (fn) => {
    if (document.readyState === "complete") fn();
    else window.addEventListener("load", fn);
};

export { supportedInterfaces };
