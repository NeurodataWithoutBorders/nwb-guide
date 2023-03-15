function onDocumentReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") setTimeout(fn, 1)
    else document.addEventListener("DOMContentLoaded", fn)
}

// ---------------------------------------------------------
// TODO: Remove this once we have a Web Component solution
// ---------------------------------------------------------

let ready = false
let callbacks = []
export const addReadyCallback = (callback) => {
    if (ready) callback()
    else callbacks.push(callback)
}

// adds the apps HTML pages to the DOM
onDocumentReady(async function () {

    // NOTE: This is a bottleneck on load times for the Vite dev server
    const links = document.querySelectorAll('link[rel="import"]');
    let main = document.querySelector("nwb-main");
    let sectionIds = [];
    for (const link of links) {
        let doc = await fetch(link.href, {
            headers: {
                "Content-Type": "text/html",
            },
        });

        let content = await doc.text();
        //get the id of the first section in content
        let id = content.match(/id="(.*)"/)[1];
        sectionIds.push(id);

        //Add the HTML Section to the #content container
        main.content.innerHTML += content;
    }

    const waitForHtmlSectionsToInsertIntoDOM = () => {
        return new Promise((resolve) => {
            let interval = setInterval(() => {
                let allPresentInDom = true;
                for (const sectionId of sectionIds) {
                    if (!document.getElementById(sectionId)) {
                        allPresentInDom = false;
                        break;
                    }
                }
                if (allPresentInDom) {
                    clearInterval(interval);
                    resolve();
                } else {
                }
            }, 100);
        });
    };

    await waitForHtmlSectionsToInsertIntoDOM();

    // Run arbitrary callbacks
    ready = true
    callbacks.forEach(f => f())
});
