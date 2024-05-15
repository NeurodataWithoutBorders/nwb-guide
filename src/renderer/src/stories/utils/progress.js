import { openProgressSwal } from "../pages/guided-mode/options/utils.js";
import { ProgressBar } from "../ProgressBar";
import { baseUrl } from "../../server/globals";
import { createRandomString } from "../forms/utils";

export const createProgressPopup = async (options, tqdmCallback) => {
    const cancelController = new AbortController();

    if (!("showCancelButton" in options)) {
        options.showCancelButton = true;
        options.customClass = { actions: "swal-conversion-actions" };
    }

    const popup = await openProgressSwal(options, (result) => {
        if (!result.isConfirmed) cancelController.abort();
    });

    let elements = {};
    popup.hideLoading();
    const element = (elements.container = popup.getHtmlContainer());
    element.innerText = "";

    Object.assign(element.style, {
        marginTop: "5px",
    });

    const container = document.createElement("div");
    Object.assign(container.style, {
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        width: '100%',
        gap: "5px",
    });
    element.append(container);

    const bars = {};

    const getBar = (id, large = false) => {
        if (!bars[id]) {
            const bar = new ProgressBar({ size: large ? undefined : "small" });
            bars[id] = bar;
            container.append(bar);
        }
        return bars[id];
    };

    const globalSymbol = Symbol("global");

    elements.progress = getBar(globalSymbol, true);

    elements.bars = bars;

    const commonReturnValue = { swal: popup, fetch: { signal: cancelController.signal }, elements, ...options };

    // Provide a default callback
    let lastUpdate;

    const id = createRandomString();

    const onProgressMessage = ({ data }) => {
        const parsed = JSON.parse(data);
        const { request_id, ...update } = parsed;

        if (request_id && request_id !== id) return;
        lastUpdate = Date.now();

        const _barId = parsed.progress_bar_id;
        const barId = id === _barId ? globalSymbol : _barId;
        const bar = getBar(barId);
        if (!tqdmCallback) bar.format = parsed.format_dict;
        else tqdmCallback(update);
    };

    progressHandler.addEventListener("message", onProgressMessage);

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const close = async () => {
        if (lastUpdate) {
            // const timeSinceLastUpdate = now - lastUpdate;
            const animationLeft = 1000; // ProgressBar.animationDuration - timeSinceLastUpdate; // Add 100ms to ensure the animation has time to complete
            if (animationLeft) await sleep(animationLeft);
        }

        popup.close();

        progressHandler.removeEventListener("message", onProgressMessage);
    };

    return { ...commonReturnValue, id, close };
};

const eventsURL = new URL("/neuroconv/events", baseUrl).href;

class ProgressHandler {
    constructor(props) {
        const { url, callbacks, ...otherProps } = props;

        const source = (this.source = new EventSource(url));
        Object.assign(this, otherProps);

        source.addEventListener("error", this.onerror(), false);

        source.addEventListener("open", () => this.onopen(), false);

        source.addEventListener("message", (event) => this.onmessage(event), false);
    }

    onopen = () => {};
    onmessage = () => {};
    onerror = () => {};

    addEventListener = (...args) => this.source.addEventListener(...args);
    removeEventListener = (...args) => this.source.removeEventListener(...args);
}

export const progressHandler = new ProgressHandler({ url: eventsURL });
