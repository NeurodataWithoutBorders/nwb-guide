
import Swal from 'sweetalert2'
import { notyf, baseUrl } from '../../../../globals.js';

export const runConversion = async (info, message = "Running conversion") => {

    Swal.fire({
      title: message,
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


    const results = await fetch(`${baseUrl}/neuroconv/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info)
    }).then((res) => res.json())


    Swal.close();

    if (results.message) {
      const message = results.message.includes('already exists') ? "File already exists. Please specify another location to store the conversion results" : results.message
      notyf.open({
        type: "error",
        message,
      });
      throw new Error(`Conversion failed with current metadata: ${results.message}`)
    }

    return results
}
