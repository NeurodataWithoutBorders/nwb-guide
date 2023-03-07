const shell = require("electron").shell;

const links = document.querySelectorAll("a[href]");

Array.prototype.forEach.call(links, (link) => {
    const url = link.getAttribute("href");
    if (url.indexOf("http") === 0) {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            shell.openExternal(url);
        });
    }
});

function sodaVideo() {
    document.getElementById("overview-column-1").blur();
    shell.openExternal("https://docs.sodaforsparc.io/docs/getting-started/user-interface");
}

function directToDocumentation() {
    shell.openExternal(
        "https://docs.sodaforsparc.io/docs/getting-started/organize-and-submit-sparc-datasets-with-soda"
    );
    document.getElementById("overview-column-2").blur();
    // window.open('https://docs.sodaforsparc.io', '_blank');
}
const directToGuidedMode = () => {
    const guidedModeLinkButton = document.getElementById("guided_mode_view");
    guidedModeLinkButton.click();
};
const directToFreeFormMode = () => {
    const freeFormModeLinkButton = document.getElementById("main_tabs_view");
    freeFormModeLinkButton.click();
};

document.getElementById("doc-btn").addEventListener("click", directToDocumentation);
document
    .getElementById("home-button-interface-instructions-link")
    .addEventListener("click", sodaVideo);
document
    .getElementById("home-button-guided-mode-link")
    .addEventListener("click", directToGuidedMode);
document
    .getElementById("home-button-free-form-mode-link")
    .addEventListener("click", directToFreeFormMode);
