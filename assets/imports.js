function docReady(fn) {
  // see if DOM is already available
  if (document.readyState === "complete" || document.readyState === "interactive") {
    // call on next available tick
    setTimeout(fn, 1);
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

// adds the apps HTML pages to the DOM
docReady(async function () {
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

  //Synchronously include js files
  require("./ex-links.js");
  require("./nav.js");
  require("./demo-btns.js");
  require("../scripts/others/renderer.js");
  require("../scripts/others/progressContainer.js");
  require("../scripts/others/pennsieveDatasetImporter.js");
  require("../scripts/others/tab-effects.js");
  require("../scripts/disseminate/disseminate.js");
  require("../scripts/disseminate/prePublishingReview.js");
  require("../scripts/manage-dataset/manage-dataset.js");
  require("../scripts/metadata-files/datasetDescription.js");
  require("../scripts/organize-dataset/curate-functions.js");
  require("../scripts/organize-dataset/organizeDS.js");
  require("../scripts/metadata-files/manifest.js");
  require("../scripts/metadata-files/readme-changes.js");
  require("../scripts/metadata-files/subjects-samples.js");
  require("../scripts/metadata-files/submission.js");
  require("../scripts/guided-mode/lottieJSON.js");
  require("../scripts/guided-mode/guided-curate-dataset.js");
  require("../scripts/collections/collections.js");
  require("../scripts/others/announcements.js");
});
