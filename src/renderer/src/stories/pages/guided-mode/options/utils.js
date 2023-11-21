import Swal from "sweetalert2";
import { baseUrl } from "../../../../globals.js";
import { sanitize } from "../../utils.js";
import { Loader } from "../../../Loader";

export const openProgressSwal = (options, callback) => {
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
                resolve(Swal);
            },
            ...options,
        }).then((result) => callback?.(result));
    });
};

export const run = async (url, payload, options = {}) => {

    let internalSwal

    if (options.swal === false) {}
    else if (!options.swal || options.swal === true) {

        if (!("showCancelButton" in options)) {
            options.showCancelButton = true;
            options.customClass = { actions: "swal-conversion-actions" };
        }

        const cancelController = new AbortController();

        options.fetch = {
            signal: cancelController.signal,
        };

        const popup = internalSwal = await openProgressSwal(options, (result) => {
            if (!result.isConfirmed) cancelController.abort();
        }).then(async (swal) => {
            if (options.onOpen) await options.onOpen(swal);
            return swal;
        });

        const element = popup.getHtmlContainer();
        const actions = popup.getActions();
        const loader = actions.querySelector(".swal2-loader");
        const container = document.createElement("div");
        container.append(loader);
        element.innerText = "";
        Object.assign(container.style, {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "25px",
        });

        element.appendChild(container);

        element.insertAdjacentHTML("beforeend", `<hr style="margin-bottom: 0;">`);
    }

    if (!("base" in options)) options.base = "/neuroconv";

    // Clear private keys from being passed
    payload = sanitize(structuredClone(payload));

    const results = await fetch(`${baseUrl}${options.base || ""}/${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        ...(options.fetch ?? {}),
    }).then((res) => res.json());

    if (internalSwal) Swal.close();

    if (results?.message) throw new Error(`Request to ${url} failed: ${results.message}`);

    return results || true;
};

export const runConversion = async (info, options = {}) =>
    run(`convert`, info, {
        title: "Running the conversion",
        onError: (results) => {
            if (results.message.includes("already exists")) {
                return "File already exists. Please specify another location to store the conversion results";
            } else {
                return "Conversion failed with current metadata. Please try again.";
            }
        },
        ...options,
    });
