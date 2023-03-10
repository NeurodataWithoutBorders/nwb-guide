var userAgent = navigator.userAgent.toLowerCase();

export const isElectron = userAgent.indexOf(' electron/') > -1
