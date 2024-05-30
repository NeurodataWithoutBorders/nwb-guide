let updateAvailable = false;
const updateAvailableCallbacks = [];
export const onUpdateAvailable = (callback) => {
    if (updateAvailable) callback(updateAvailable);
    else updateAvailableCallbacks.push(callback);
};

let updateProgress = null;

const updateProgressCallbacks = [];
export const onUpdateProgress = (callback) => {
    if (updateProgress) callback(updateProgress);
    else updateProgressCallbacks.push(callback);
};

export const registerUpdateProgress = (info) => {
    updateProgress = info;
    updateProgressCallbacks.forEach((cb) => cb(info));
};

export const registerUpdate = (info) => {
    updateAvailable = info;
    document.body.setAttribute("data-update-available", JSON.stringify(info));
    updateAvailableCallbacks.forEach((cb) => cb(info));
};
