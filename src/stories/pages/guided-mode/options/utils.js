
import Swal from 'sweetalert2'
import { notyf, baseUrl } from '../../../../globals.js';

export const run = async (url, payload, options={}) => {

    Swal.fire({
        title: options.title ?? "Requesting data from server",
        html: "Please wait...",
        allowEscapeKey: false,
        allowOutsideClick: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        didOpen: () => {
          Swal.showLoading();
        },
      })


      const results = await fetch(`${baseUrl}/neuroconv/${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then((res) => res.json())


      Swal.close();

      if (results?.message) {
        const message = options.onError ? options.onError(results) : results.message
        notyf.open({
          type: "error",
          message,
        });
        throw new Error(`Request to ${url} failed: ${results.message}`)
      }

      return results || true
}

export const runConversion = async (info) => run(`convert`, info, {
    title: "Running the conversion",
    onError: (results) => {
        if (results.message.includes('already exists')) {
            return "File already exists. Please specify another location to store the conversion results"
        } else {
            return "Conversion failed with current metadata. Please try again."
        }
    }
})
