import { path } from "./electron/index.js";

import guideGlobalMetadata from "../guideGlobalMetadata.json" assert { type: "json" };

export const joinPath = (...args) => (path ? path.join(...args) : args.filter((str) => str).join("/"));

export let runOnLoad = (fn) => {
    if (document.readyState === "complete") fn();
    else window.addEventListener("load", fn);
};

export const supportedInterfaces = guideGlobalMetadata.supported_interfaces;
