import Swal from "sweetalert2";
import { baseUrl } from "../../../../globals.js";
import { sanitize } from "../../utils.js";

export const openProgressSwal = (options, callback) => {
    return new Promise((resolve) => {
        Swal.fire({
            title: "Requesting data from server",
            html: `Please wait...`,
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
    const needsSwal = !options.swal && options.swal !== false;
    if (needsSwal) openProgressSwal(options).then((swal) => (options.onOpen ? options.onOpen(swal) : undefined));

    if (!("base" in options)) options.base = "/neuroconv";

    // Clear private keys from being passed
    payload = sanitize(structuredClone(payload));

    const results = await fetch(`${baseUrl}${options.base || ""}/${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        ...(options.fetch ?? {}),
    }).then((res) => res.json());

    if (needsSwal) Swal.close();

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
