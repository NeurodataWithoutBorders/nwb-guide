import { path, port } from "./electron/index.js";

import guideGlobalMetadata from "../../../guideGlobalMetadata.json" assert { type: "json" };

export const joinPath = (...args) => (path ? path.join(...args) : args.filter((str) => str).join("/"));

export let runOnLoad = (fn) => {
    if (document.readyState === "complete") fn();
    else window.addEventListener("load", fn);
};

// Base Request URL for Python Server
export const baseUrl = `http://127.0.0.1:${port}`;

export const supportedInterfaces = guideGlobalMetadata.supported_interfaces;
