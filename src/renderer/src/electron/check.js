// var userAgent = navigator.userAgent.toLowerCase();
// export const isElectron = userAgent.indexOf(" electron/") > -1;

// Storybook polyfill
if (!globalThis.commoners && window.location.href.includes("iframe.html")) {
    globalThis.commoners = {
        version: "Storybook",
        target: "web",
        plugins: {},
        services: {},
    };
}

export default commoners.target === "desktop";
