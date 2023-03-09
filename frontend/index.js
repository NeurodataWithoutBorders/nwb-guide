function onDocumentReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") setTimeout(fn, 1)
    else document.addEventListener("DOMContentLoaded", fn)
}

// Set Sidebar Behaviors
onDocumentReady(() => {

    // Toggle sidebar
    const sidebar = document.getElementById("sidebarCollapse");
    sidebar.addEventListener('click', () => {
        const mainNav = document.getElementById("main-nav");
        mainNav.classList.toggle("active");
        sidebar.classList.toggle("active");
        const section = document.getElementsByClassName("section")[0];
        section.classList.toggle("fullShown");
    });

    // Clear all selected links and add selected class to the clicked link
    document.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => {
            a.parentNode.parentNode.querySelectorAll('a').forEach((a) => a.classList.remove('is-selected'))
            a.classList.add('is-selected')
        })
    })
});

// ---------------------------------------------------------
// TODO: Remove this once we have a Web Component solution
// ---------------------------------------------------------

// adds the apps HTML pages to the DOM
onDocumentReady(async function () {
    const links = document.querySelectorAll('link[rel="import"]');
    let contentIndex = document.querySelector("#content");

    // Array that will contain all of the sectionIDs that are to be
    // inserted into contentIndex
    let sectionIds = [];

    // Import and add each page to the DOM
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
        contentIndex.innerHTML += content;
    }

    //Check to see if the links have been added to the DOM
    //If not, try again in 100ms
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

    // -------------------- For Electron Builds --------------------
    var userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf(' electron/') > -1) {
        await import("./shell-commands.js")
    }

    await import("./nav.js");
    await import("./renderer.js");
});
