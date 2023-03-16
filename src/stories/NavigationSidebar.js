

import { LitElement, html } from 'lit';
import useGlobalStyles from './utils/useGlobalStyles.js';

const componentCSS = `

`

export class NavigationSidebar extends LitElement {

  static get styles() {
    return useGlobalStyles(componentCSS, sheet => sheet.href && sheet.href.includes('bootstrap'), this.shadowRoot)
  }

  static get properties() {
    return {
      items: { type: Object, reflect: false },
      active: { type: String, reflect: true },
    };
  }

  constructor ({
    items = {}
  } = {}) {
    super()
    this.items = items
  }

  createRenderRoot() {
    return this;
  }

  attributeChangedCallback(...args) {
    const attrs = ['items', 'active']
    super.attributeChangedCallback(...args)
    if (attrs.includes(args[0])) this.requestUpdate()
  }

  #queue = []
  #sectionStates = {}

  updated(){
    this.nav = (this.shadowRoot ?? this).querySelector("#guided-nav");
    for (let section in this.#sectionStates) {
      const state = this.#sectionStates[section]
      if 
      ( state.open || state.active ) {
        this.#openDropdown(section, true)
      }
    }

    if (this.#queue.length) {
      this.#queue.forEach(content => content())
      this.#queue = []
    }    
  }

  show(){
    if (this.nav) this.nav.style.display = "block";
    else this.#queue.push(() => this.show())
  }

  hide(){
    if (this.nav) this.nav.style.display = "none";
    else this.#queue.push(() => this.hide())
  }

  onClick = () => {} // Set by the user


  #updateClass = (name, el, force) => {
    if (force === undefined) el.classList.toggle(name);
      else {
        if (force) el.classList.remove(name);
        else el.classList.add(name);
      } 
  }

  reset() {
    this.#sectionStates = {}
  }

  #openDropdown = (sectionName, forcedState) => {    
    
    const hasForce = forcedState !== undefined
    //remove hidden from child elements with guided--nav-bar-section-page class
    const children = this.querySelectorAll( "[data-section='" + sectionName + "']");
    for (const child of children) this.#updateClass('hidden', child, forcedState)

    const dropdown = this.querySelector( "[data-section-name='" + sectionName + "']");
    
    const toggledState = !this.#sectionStates[sectionName].open

    //toggle the chevron
    const chevron = dropdown.querySelector("i");
    this.#updateClass("fa-chevron-right", chevron, forcedState)
    this.#updateClass("fa-chevron-down", chevron, hasForce ? !forcedState : toggled)

    this.#sectionStates[sectionName].open = hasForce ? forcedState : toggledState
}

  render() {

    const itemsBySection = Object.entries(this.items).reduce((acc, [id, value]) => {
      if (value.section) {

        const section = value.section

        let state = this.#sectionStates[section]
        if (!acc[section]) {
          acc[section] = []
          if (!state) state = this.#sectionStates[section] = { open: false, active: false, pages: {} }
          state.active = false
        }


        let page = state.pages[id]
        if (!page) page = state.pages[id] = { visited: false, active: false, value }
        if (!('visited' in page)) page.visited = false
        if (id === this.active) page.visited = page.active = true // Set active page as visited

        acc[section].push({ id, value })
      }
      return acc
    }, {})
    
    return html`
<nav id="guided-nav" class="guided--nav">
    <img class="nav-center-logo-image" src="assets/img/logo-neuroconv.png" />
    <h1 class="guided--text-sub-step mb-0 mt-0">Guided Mode</h1>
    <p
      class="guided--help-text mb-0 mt-md"
      style="border-bottom: 1px solid var(--color-light-green)"
      id="guided-page-navigation-header"
    >
      <b>Page navigation</b>
    </p>

    <ul id="guided-nav-items" class="guided--container-nav-items">
      ${Object.entries(itemsBySection).map(([sectionName, arr]) => {
        return html`
        <div class="guided--nav-bar-section">
          <div 
            class="guided--nav-bar-dropdown"
            data-section-name=${sectionName}
            @click=${() => this.#openDropdown(sectionName)}
          >
            <p class="guided--help-text mb-0">
              ${sectionName}
            </p>
            <i class="fas fa-chevron-right"></i>
          </div>
          ${arr.map(({ id }) => {
            const isActive = this.active === id
            const sectionState = this.#sectionStates[sectionName]
            const state = sectionState.pages[id]
            const value = state.value
            if (isActive) sectionState.active = true

            return html`<div
              data-section="${sectionName}"
              class="
                guided--nav-bar-section-page
                hidden
                ${state.visited ? " completed" : " not-completed"}
                ${isActive ? "active" : ""}"
              " 
              @click=${() => this.onClick(id, value)}
            >
              <div class="guided--nav-bar-section-page-title">
                ${value.label ?? id}
              </div>
            </div>
          </div>
          `
        })}
        `
      }).flat()}
    </ul>
</nav>
    `;
  }
};

customElements.get('nwb-navigation-sidebar') || customElements.define('nwb-navigation-sidebar',  NavigationSidebar);


// const guidedNavItemsContainer = document.getElementById("guided-nav-items");
// const guidedPageNavigationHeader = document.getElementById("guided-page-navigation-header");

// if (activePage === "guided-dataset-dissemination-tab") {
//   //Hide the side bar navigawtion and navigation header
//   guidedPageNavigationHeader.classList.add("hidden");
//   guidedNavItemsContainer.innerHTML = ``;
//   return;
// }
// //Show the page navigation header if it had been previously hidden
// guidedPageNavigationHeader.classList.remove("hidden");

// const completedTabs = globals.sodaJSONObj["completed-tabs"];
// const skippedPages = globals.sodaJSONObj["skipped-pages"];

// const pageStructureObject = {};

// const highLevelStepElements = Array.from(document.querySelectorAll(".guided--parent-tab"));

// for (const element of highLevelStepElements) {
//   const highLevelStepName = element.getAttribute("data-parent-tab-name");
//   pageStructureObject[highLevelStepName] = {};

//   const notSkippedPages = getNonSkippedGuidedModePages(element);

//   for (const page of notSkippedPages) {
//     const pageName = page.getAttribute("data-page-name");
//     const pageID = page.getAttribute("id");
//     pageStructureObject[highLevelStepName][pageID] = {
//       pageName: pageName,
//       completed: completedTabs.includes(pageID),
//     };
//   }
// }
// let navBarHTML = "";
// for (const [highLevelStepName, highLevelStepObject] of Object.entries(pageStructureObject)) {
//   // Add the high level drop down to the nav bar
//   const dropdDown = `
//   <div class="guided--nav-bar-dropdown">
//     <p class="guided--help-text mb-0">
//       ${highLevelStepName}
//     </p>
//     <i class="fas fa-chevron-right"></i>
//   </div>
// `;

//   // Add the high level drop down's children links to the nav bar
//   let dropDownContent = ``;
//   for (const [pageID, pageObject] of Object.entries(highLevelStepObject)) {
//     //add but keep hidden for now!!!!!!!!!!!!!!!!!!
//     dropDownContent += `
//     <div
//       class="
//         guided--nav-bar-section-page
//         hidden
//         ${pageObject.completed ? " completed" : " not-completed"}
//         ${pageID === activePage ? "active" : ""}"
//       data-target-page="${pageID}"
//     >
//       <div class="guided--nav-bar-section-page-title">
//         ${pageObject.pageName}
//       </div>
//     </div>
//   `;
//   }

//   // Add each section to the nav bar element
//   const dropDownContainer = `
//     <div class="guided--nav-bar-section">
//       ${dropdDown}
//       ${dropDownContent}
//     </div>
//   `;
//   navBarHTML += dropDownContainer;
// }
// guidedNavItemsContainer.innerHTML = navBarHTML;

// const guidedNavBarDropdowns = Array.from(document.querySelectorAll(".guided--nav-bar-dropdown"));
// for (const guidedNavBarDropdown of guidedNavBarDropdowns) {
//   guidedNavBarDropdown.addEventListener("click", (event) => {
//     //remove hidden from child elements with guided--nav-bar-section-page class
//     const guidedNavBarSectionPage = guidedNavBarDropdown.parentElement.querySelectorAll(
//       ".guided--nav-bar-section-page"
//     );
//     for (const guidedNavBarSectionPageElement of guidedNavBarSectionPage) {
//       guidedNavBarSectionPageElement.classList.toggle("hidden");
//     }
//     //toggle the chevron
//     const chevron = guidedNavBarDropdown.querySelector("i");
//     chevron.classList.toggle("fa-chevron-right");
//     chevron.classList.toggle("fa-chevron-down");
//   });

//   //click the dropdown if it has a child element with data-target-page that matches the active page
//   if (guidedNavBarDropdown.parentElement.querySelector(`[data-target-page="${activePage}"]`)) {
//     guidedNavBarDropdown.click();
//   }
// }

// const guidedNavBarSectionPages = Array.from(
//   document.querySelectorAll(".guided--nav-bar-section-page")
// );
// for (const guidedNavBarSectionPage of guidedNavBarSectionPages) {
//   guidedNavBarSectionPage.addEventListener("click", async (event) => {
//     const currentPageUserIsLeaving = CURRENT_PAGE.attr("id");
//     const pageToNavigateTo = guidedNavBarSectionPage.getAttribute("data-target-page");
//     const pageToNaviatetoName = document
//       .getElementById(pageToNavigateTo)
//       .getAttribute("data-page-name");

//     // Do nothing if the user clicks the tab of the page they are currently on
//     if (currentPageUserIsLeaving === pageToNavigateTo) {
//       return;
//     }

//     try {
//       await savePageChanges(currentPageUserIsLeaving);
//       const allNonSkippedPages = getNonSkippedGuidedModePages(document).map(
//         (element) => element.id
//       );
//       // Get the pages in the allNonSkippedPages array that cone after the page the user is leaving
//       // and before the page the user is going to
//       const pagesBetweenCurrentAndTargetPage = allNonSkippedPages.slice(
//         allNonSkippedPages.indexOf(currentPageUserIsLeaving),
//         allNonSkippedPages.indexOf(pageToNavigateTo)
//       );

//       //If the user is skipping forward with the nav bar, pages between current page and target page
//       //Need to be validated. If they're going backwards, the for loop below will not be ran.
//       for (const page of pagesBetweenCurrentAndTargetPage) {
//         try {
//           await checkIfPageIsValid(page);
//         } catch (error) {
//           const pageWithErrorName = document.getElementById(page).getAttribute("data-page-name");
//           await openPage(page);
//           await Swal.fire({
//             title: `An error occured on an intermediate page: ${pageWithErrorName}`,
//             html: `Please address the issues before continuing to ${pageToNaviatetoName}:
//               <br />
//               <br />
//               <ul>
//                 ${error.map((error) => `<li class="text-left">${error.message}</li>`).join("")}
//               </ul>
//             `,
//             icon: "info",
//             confirmButtonText: "Fix the errors on this page",
//             focusConfirm: true,
//             heightAuto: false,
//             backdrop: "rgba(0,0,0, 0.4)",
//             width: 700,
//           });
//           return;
//         }
//       }

//       //All pages have been validated. Open the target page.
//       await openPage(pageToNavigateTo);
//     } catch (error) {
//       const pageWithErrorName = CURRENT_PAGE.data("pageName");
//       const { value: continueWithoutSavingCurrPageChanges } = await Swal.fire({
//         title: "The current page was not able to be saved",
//         html: `The following error${
//           error.length > 1 ? "s" : ""
//         } occurred when attempting to save the ${pageWithErrorName} page:
//           <br />
//           <br />
//           <ul>
//             ${error.map((error) => `<li class="text-left">${error.message}</li>`).join("")}
//           </ul>
//           <br />
//           Would you like to continue without saving the changes to the current page?`,
//         icon: "info",
//         showCancelButton: true,
//         confirmButtonText: "Yes, continue without saving",
//         cancelButtonText: "No, I would like to address the errors",
//         confirmButtonWidth: 255,
//         cancelButtonWidth: 255,
//         focusCancel: true,
//         heightAuto: false,
//         backdrop: "rgba(0,0,0, 0.4)",
//         width: 700,
//       });
//       if (continueWithoutSavingCurrPageChanges) {
//         await openPage(pageToNavigateTo);
//       }
//     }
//   });
// }

// const nextPagetoComplete = guidedNavItemsContainer.querySelector(
//   ".guided--nav-bar-section-page.not-completed"
// );
// if (nextPagetoComplete) {
//   nextPagetoComplete.classList.remove("not-completed");
//   //Add pulse blue animation for 3 seconds
//   nextPagetoComplete.style.borderLeft = "3px solid #007bff";
//   nextPagetoComplete.style.animation = "pulse-blue 3s infinite";
// }