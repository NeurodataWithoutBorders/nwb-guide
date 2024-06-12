
import Swal, { SweetAlertOptions } from "sweetalert2";
import { ProgressBar } from "../core/components/ProgressBar";
import { getRandomString } from "./random";

import progressHandler from "./progress";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const openProgressSwal = (
    options: SweetAlertOptions, 
    callback: (result: any) => void
): Promise<true> => {
    return new Promise((resolve) => {
        Swal.fire({
            title: "Requesting data from server",
            allowEscapeKey: false,
            allowOutsideClick: false,
            showConfirmButton: false,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            timerProgressBar: false,
            didOpen: () => {
                Swal.showLoading();
                resolve(true);
            },
            ...options,
        }).then((result) => callback?.(result));
    });
};

export const createProgressPopup = async (
    options: SweetAlertOptions, 
    tqdmCallback: (update: any) => void
) => {
    const cancelController = new AbortController();

    if (!("showCancelButton" in options)) {
        options.showCancelButton = true;
        options.customClass = { actions: "swal-conversion-actions" };
    }

    const popup = await openProgressSwal(options, (result) => {
        if (!result.isConfirmed) cancelController.abort();
    });

    let elements: Record<string, HTMLElement | Record<string, HTMLElement>> = {};
    Swal.hideLoading();
    const element = elements.container = Swal.getHtmlContainer()!;
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
        width: "100%",
        gap: "5px",
    });
    element.append(container);

    const bars: Record<string | symbol, ProgressBar> = {};

    const getBar = (
        id: string | symbol,
        large = false
    ) => {
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
    let lastUpdate: number;

    const id = getRandomString();

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

    const close = async () => {
        if (lastUpdate) {
            // const timeSinceLastUpdate = now - lastUpdate;
            const animationLeft = 1000; // ProgressBar.animationDuration - timeSinceLastUpdate; // Add 100ms to ensure the animation has time to complete
            if (animationLeft) await sleep(animationLeft);
        }

        Swal.close();

        progressHandler.removeEventListener("message", onProgressMessage);
    };

    return { ...commonReturnValue, id, close };
};
