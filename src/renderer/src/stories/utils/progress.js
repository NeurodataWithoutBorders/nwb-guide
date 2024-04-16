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
        textAlign: "left",
        display: "block",
    });

    const bars = {}

    const getBar = (id) => {
        if (!bars[id]) {
            const bar = new ProgressBar();
            bars[id] = bar;
            element.append(bar);
        }
        return bars[id];
    }

    const globalSymbol = Symbol("global");

    elements.progress = getBar(globalSymbol);

    elements.bars = bars;

    const commonReturnValue = { swal: popup, fetch: { signal: cancelController.signal }, elements, ...options };

    // Provide a default callback
    let lastUpdate;

    const id = createRandomString();

    const onProgressMessage = ({ data }) => {
        const parsed = JSON.parse(data);
        const { request_id, ...update } = parsed;
        console.log("parsed", parsed)

        if (request_id && request_id !== id) return;
        lastUpdate = Date.now();
        
        const _barId = parsed.progress_bar_id;
        const barId = id === _barId ? globalSymbol : _barId;
        const bar = getBar(barId);
        if (!tqdmCallback) bar.value = parsed.format_dict
        else tqdmCallback(update);
    };

    progressHandler.addEventListener("message", onProgressMessage);

    const close = () => {
        if (lastUpdate) {
            // const timeSinceLastUpdate = now - lastUpdate;
            const animationLeft = 1000 // ProgressBar.animationDuration - timeSinceLastUpdate; // Add 100ms to ensure the animation has time to complete
            if (animationLeft) setTimeout(() => popup.close(), animationLeft);
            else popup.close();
        } else popup.close();

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
