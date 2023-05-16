import Swal from "sweetalert2";
import { baseUrl } from "../../../../globals.js";

export const openProgressSwal = (options) => {
    return new Promise(resolve => {
        Swal.fire({
            title: options.title ?? "Requesting data from server",
            html: `Please wait...`,
            allowEscapeKey: false,
            allowOutsideClick: false,
            showConfirmButton: false,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            timerProgressBar: false,
            didOpen: () => {
                Swal.showLoading();
                resolve(Swal)
            },
        });    
    })

}

export const run = async (url, payload, options = {}) => {

    const needsSwal = !options.swal
    if (needsSwal) openProgressSwal(options).then(swal => (options.onOpen) ? options.onOpen(swal)  :undefined)

    const results = await fetch(`${baseUrl}/neuroconv/${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    }).then((res) => res.json());

    if (needsSwal) Swal.close();

    if (results?.message) throw new Error(`Request to ${url} failed: ${results.message}`);

    return results || true;
};

export const runConversion = async (info, options = {}) => run(`convert`, info, {
        title: "Running the conversion",
        onError: (results) => {
            if (results.message.includes("already exists")) {
                return "File already exists. Please specify another location to store the conversion results";
            } else {
                return "Conversion failed with current metadata. Please try again.";
            }
        },
        ...options
    });