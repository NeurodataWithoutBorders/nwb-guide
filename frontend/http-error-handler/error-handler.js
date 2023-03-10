/**
 * Logs an error object to the console and SODA logs. Handles general errors and Axios errors.
 *
 * @param {error} error - A general or Axios error object
 */
export function clientError(error) {
  // Handles gneral errors and getting basic information from Axios errors
  console.error(error);

  // Handle logging for Axios errors in greater detail
  if (error.response) {
    let error_message = error.response.data.message;
    let error_status = error.response.status;
    let error_headers = error.response.headers;

    console.log(`Error caused from: ${error_message}`);
    console.log(`Response Status: ${error_status}`);
    console.log("Headers:");
    console.log(error_headers);
  }
}

/**
 * Given an error object, take the message out of the appropriate error property and present it in a readable format.
 * Useful for getting a useful error message out of both Axios and general errors.
 * @param {Error} error - The error object. Can be a general Error or an Axios subclass.
 * @returns {string} - The error message to display to the user
 */
export function userErrorMessage(error) {
  let errorMessage = "";
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    errorMessage = `${error.response.data.message}`;
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    errorMessage =
      "The server did not respond to the request. Please try again later or contact the soda team at help@fairdataihub.org if this issue persits.";
  } else {
    // Something happened in setting up the request that triggered an Error
    errorMessage = error.message;
  }

  return errorMessage;
}
