import Swal, { SweetAlertOptions } from "sweetalert2";
import { sanitize } from "./data";
import { baseUrl } from "../core/server/globals";
import { openProgressSwal } from "./popups";

type Options = {
    swal?: boolean;
    fetch?: any;
    onOpen?: (swal: any) => void;
} & SweetAlertOptions

type PayloadType = Record<string, any>;

export const run = async (
    pathname: string,
    payload: PayloadType,
    options: Options = {}
) => {

    let internalSwal = false;

    if (options.swal === false) {
    } else if (!options.swal || options.swal === true) {
        if (!("showCancelButton" in options)) {
            options.showCancelButton = true;
            options.customClass = { actions: "swal-conversion-actions" };
        }

        const cancelController = new AbortController();

        options.fetch = {
            signal: cancelController.signal,
        };

        internalSwal = await openProgressSwal(options, (result) => {
            if (!result.isConfirmed) cancelController.abort();
        }).then(async (swal) => {
            if (options.onOpen) await options.onOpen(swal);
            return swal;
        });

        const element = Swal.getHtmlContainer()!;

        const actions = Swal.getActions()!;
        const loader = actions.querySelector(".swal2-loader")!;
        const container = document.createElement("div");
        container.append(loader);

        const notDisplayed = element.style.display === "none";

        Object.assign(element.style, {
            marginTop: notDisplayed ? "" : "0",
            display: "unset",
        });

        Object.assign(container.style, {
            marginTop: notDisplayed ? "" : "25px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "25px",
        });

        element.appendChild(container);

        element.insertAdjacentHTML("beforeend", `<hr style="margin-bottom: 0;">`);
    }

    // Clear private keys from being passed
    payload = sanitize(structuredClone(payload));

    const results = await fetch(new URL(pathname, baseUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        ...(options.fetch ?? {}),
    })
        .then(async (res) => {
            const json = await res.json();

            if (!res.ok) {
                const message = json.message;
                const header = `<h4 style="margin: 0;">Request to ${pathname} failed</h4><small>${json.type}</small>`;
                const text = message.replaceAll("<", "&lt").replaceAll(">", "&gt").trim();
                throw new Error(`${header}<p>${text}</p>`);
            }
            return json;
        })
        .finally(() => {
            if (internalSwal) Swal.close();
        });

    return results || true;
};

export const runConversion = async (
    info: PayloadType,
    options = {}
) => run(`neuroconv/convert`, info, {
    title: "Running the conversion",
    ...options,
});
