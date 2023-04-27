

import { LitElement, css, html } from 'lit';
import { errorColor, successColor, warningColor } from './globals';

// import 'fa-icons';

const faSize = '1em'
const faColor = "#000000"

export class Accordion extends LitElement {

  static get styles() {
    return css`

    * {
      box-sizing: border-box;
    }

    .header {
      display: flex;
      align-items: end;
      padding: 20px 0px;
    }

    .chevron {
      padding: 0 10px;
    }

    .chevron::before {
      border-style: solid;
      border-width: 0.23em 0.23em 0 0;
      content: '';
      display: inline-block;
      height: 0.45em;
      transform: rotate(-45deg);
      vertical-align: top;
      width: 0.45em;
    }

    .chevron.right:before {
      left: 0;
      position: relative;
      top: 0.15em;
      transform: rotate(45deg);
    }

    .chevron.bottom:before {
      top: 0;
      transform: rotate(135deg);
    }

    .header > * {
      line-height: initial;
      margin: 0;
      padding: 0;
    }

    .header > *:first-child {
      font-size: 1.2em;
      font-weight: bold;
      margin-right: 10px;
    }

    .header > *:nth-child(2) {
      padding-bottom: 2px;
    }


    .hidden {
      display: none !important;
    }

    .guided--nav-bar-section {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      width: 100%;
      height: 100%;
    }

    .guided--nav-bar-section > * {
      padding: 0px 10px;
    }


    .content {
      width: 100%;
      padding: 25px;
    }


    .guided--nav-bar-dropdown {
      position: relative;
      min-height: 40px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: nowrap;
      user-select: none;
      background-color: 	rgb(240,240,240);
      border-bottom: 1px solid gray;
    }

    .guided--nav-bar-dropdown.active {
      border-bottom: none;
    }

    .guided--nav-bar-section:last-child > .guided--nav-bar-dropdown {
      border-bottom: none;
    }

    .guided--nav-bar-dropdown.error {
      border-bottom: 5px solid ${errorColor} !important;
    }

    .guided--nav-bar-dropdown.warning {
      border-bottom: 5px solid ${warningColor} !important;
    }

    .guided--nav-bar-dropdown.valid {
      border-bottom: 5px solid ${successColor} !important;
    }

    .guided--nav-bar-dropdown:hover {
      cursor: pointer;
      background-color: lightgray;
    }

    .guided--nav-bar-section-page {
      display: flex;
      width: calc((100% - 20px));
      justify-content: flex-start;
      margin-left: 15px;
      margin-top: 3px;
      padding-left: 5px;
    }

    .guided--container-nav-items {
      width: 100%;
      list-style: none;
      padding-left: 0px;
      overflow-y: auto;
    }
    `

  }

  static get properties() {
    return {
      sections: { type: Object, reflect: false },
    };
  }

  constructor ({
    sections = {}
  } = {}) {
    super()
    this.sections = sections
  }


  updated(){
    Object.entries(this.sections).map(([sectionName, info]) => {
      const isActive = info.open
      if (isActive) this.#toggleDropdown(sectionName, true)
      else this.#toggleDropdown(sectionName, false)
    })
  }

  setSectionStatus = (sectionName, status) => {
    const el = this.shadowRoot.querySelector( "[data-section-name='" + sectionName + "']");
    el.classList.remove("error", "warning", "valid")
    el.classList.add(status)
    this.sections[sectionName].status = status
  }

  onClick = () => {} // Set by the user


  #updateClass = (name, el, force) => {
    if (force === undefined) el.classList.toggle(name);
      else {
        if (force) el.classList.remove(name);
        else el.classList.add(name);
      }
  }

  #toggleDropdown = (sectionName, forcedState) => {

    const hasForce = forcedState !== undefined
    const toggledState = !this.sections[sectionName].open

    let state = (hasForce) ? forcedState : toggledState

    //remove hidden from child elements with guided--nav-bar-section-page class
    const children = this.shadowRoot.querySelectorAll( "[data-section='" + sectionName + "']");
    for (const child of children) this.#updateClass("hidden", child, state)

    const dropdown = this.shadowRoot.querySelector( "[data-section-name='" + sectionName + "']");
    this.#updateClass("active", dropdown, !state)

    //toggle the chevron
    const chevron = dropdown.querySelector(".chevron");

    chevron.classList.add(state ? "bottom" : "right")
    chevron.classList.remove(state ? "right" : "bottom")


    this.sections[sectionName].open = state
}

  render() {

    return html`
    <ul id="guided-nav-items" class="guided--container-nav-items">
      ${Object.entries(this.sections).map(([sectionName, info]) => {
        return html`
        <div class="guided--nav-bar-section">
          <div
            class="guided--nav-bar-dropdown ${info.status}"
            data-section-name=${sectionName}
            @click=${() => this.#toggleDropdown(sectionName)}
          >
            <div class="header">
              <span>${sectionName}</span>
              <small>${info.subtitle}</small>
            </div>
            <div class="chevron right" color="${faColor}" size="${faSize}"></div>
          </div>
          <div
              data-section="${sectionName}"
              class="content hidden"
          >
            ${info.content}
          </div>
        </div>
        `
      }).flat()}
    </ul>
    `;
  }
};

customElements.get('nwb-accordion') || customElements.define('nwb-accordion',  Accordion);

// Object.entries(info.pages).map(([id, state]) => {

//   return html`<div
//     data-section="${sectionName}"
//     class="
//       guided--nav-bar-section-page
//       hidden
//       ${state.visited ? " completed" : " not-completed"}
//       ${state.active ? "active" : ""}"f
//     "
//     @click=${() => this.onClick(id)}
//   >
//     <div class="guided--nav-bar-section-page-title">
//       ${state.pageLabel ?? id}
//     </div>
//   </div>
// </div>
// `
// })
