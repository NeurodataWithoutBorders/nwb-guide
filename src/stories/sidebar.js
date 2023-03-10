
import { LitElement, html } from 'lit';
import useGlobalStyles from './utils/useGlobalStyles.js';

const componentCSS = `
/* Nav bootstrap */
/* toggle button */
#sidebarCollapse {
width: 35px;
height: 35px;
border-radius: 50%;
background: transparent;
position: relative;
top: 8px;
left: 200px;
cursor: pointer;
border: none;
z-index: 2;
transition: all 0.25s linear;
}
#sidebarCollapse span {
width: 80%;
height: 2px;
margin: 0 auto;
display: block;
background: var(--color-light-green);
transition: all 0.25s linear;
/* transition: all 0.1s cubic-bezier(0.81, -0.33, 0.345, 1.375); */
}
/* animate toggle button */
#sidebarCollapse span:first-of-type {
transition: all 0.25s linear;
transform: rotate(45deg) translate(2px, 2px);
}
#sidebarCollapse span:nth-of-type(2) {
transition: all 0.25s linear;
opacity: 0;
}
#sidebarCollapse span:last-of-type {
transition: all 0.25s linear;
transform: rotate(-45deg) translate(1px, -1px);
}
#sidebarCollapse.active span {
transition: all 0.25s linear;
transform: none;
opacity: 1;
margin: 5px auto;
}
#main-nav {
min-width: 240px;
max-width: 240px;
background: var(--color-sidebar);
border-top: 1px solid #d5d5d5;
color: #f0f0f0;
font-family: "Source Sans Pro", sans-serif;
transition: all 0.25s linear;
transform-origin: 0 50%; /* Set the transformed position of sidebar to center left side. */
}
#main-nav.active {
width: 0;
transform: rotateY(150deg); /* Rotate sidebar vertically by 100 degrees. */
transition: all 0.25s linear;
}
.navbar-btn {
transition: margin-left 600ms ease;
}
.navbar-btn.active {
margin-left: -190px;
transition: all 0.25s linear;
}
.navbar-btn:focus {
outline: none;
}
.navbar-btn.active:focus {
outline: none;
}
.dash-content.active {
margin-left: -230px;
}
a[data-toggle="collapse"] {
position: relative;
}
.dropdown-toggle::after {
display: block;
position: absolute;
top: 50%;
right: 20px;
transform: translateY(-50%);
}
#main-nav .sidebar-header {
margin-top: 10px;
margin-bottom: 30px;
/* padding: 20px; */
padding-bottom: 50px;
padding-top: 10px;
}
#main-nav ul.components {
list-style: none;
padding-right: 10px;
padding-left: 3px;
margin-right: 0;
margin-top: 30px;
}
#main-nav ul p {
color: #000;
padding: 10px;
}
#main-nav ul li a {
font-size: 14px;
display: block;
line-height: 45px;
padding-left: 20px;
margin-bottom: 5px;
text-align: left;
padding-right: 10px;
color: #000;
border: none;
border-radius: 4px;
border-left: 4px solid transparent;
}
#main-nav ul li a svg {
fill: #000;
}
#main-nav ul li a a {
padding-left: 10px;
text-align: left;
padding-right: 10px;
}
#main-nav ul li a i {
margin-right: 25px;
font-size: 20px;
}
#main-nav ul li a:hover {
text-decoration: none;
background: none;
font-weight: 600;
}
#main-nav ul li a.is-selected {
color: var(--color-light-green);
background: none;
font-weight: 600;
border-left: 4px solid var(--color-light-green);
/* margin-left: -3px; */
border-radius: 0;
}
#main-nav ul li a.is-selected svg {
fill: var(--color-light-green);
}
.help-section {
bottom: 2px;
position: absolute;
width: 230px;
}
.help-section ul {
padding-left: 15px !important;
}
.help-section a {
text-decoration: none;
line-height: 5px;
border: none;
color: #f0f0f0;
width: 35px !important;
padding-right: 3px !important;
padding-left: 3px !important;
z-index: 200;
}
.help-section a i {
font-size: 17px;
opacity: 0.7;
}
.help-section a:hover {
background: none !important;
border: none !important;
}
.help-section a:hover i {
opacity: 1;
}
.help-section a.is-selected {
color: #000 !important;
background: none !important;
border: none !important;
}
.list-unstyled {
list-style: none;
border-bottom: none;
}
.list-unstyled.components li a {
-webkit-user-drag: none;
}
.collapse:not(.show) {
display: none;
}
.collapse.show {
display: block;
}
.collapsing {
position: relative;
height: 0;
overflow: hidden;
-webkit-transition: height 0.35s ease;
-o-transition: height 0.35s ease;
transition: height 0.35s ease;
}
@media (prefers-reduced-motion: reduce) {
.collapsing {
-webkit-transition: none;
-o-transition: none;
transition: none;
}
}
.nav {
padding: 0px 0px;
position: fixed;
width: 240px;
min-height: 100vh;
color: var(--color-subtle);
visibility: visible;
left: 0;
z-index: 1;
align-items: stretch;
display: flex;
transition: 0.5s;
}
@media screen and (max-height: 500px) {
#main-nav {
padding-top: 15px;
}
#main-nav a {
font-size: 13px;
}
}
.nav.is-shown {
visibility: visible;
opacity: 1;
}
.nav-header {
position: relative;
padding: 10px 10px;
margin-top: 10px;
margin-bottom: 30px;
}
.nav-title strong {
color: var(--color-light-green);
opacity: 0.8;
transition: color 0.1s ease-in;
}
.nav-title strong:hover {
color: linear-gradient(90deg, rgba(37, 129, 147, 1) 0%, rgba(52, 207, 196, 1) 51%);
}
.nav-header-icon {
position: absolute;
width: 165px;
height: 70px;
top: 1.3rem;
right: 1.8rem;
}
.nav-item {
padding: 0.5em 0;
vertical-align: middle;
width: 240px !important;
}
.nav-icon {
width: 30px;
height: 30px;
margin-right: 27px;
padding-bottom: 1px;
padding-top: 1px;
margin-left: -22px;
margin-top: 10px;
margin-bottom: 10px;
vertical-align: middle;
}
.nav-icon.logo {
width: 45px;
height: 45px;
margin-right: 24px;
margin-left: 15px;
margin-bottom: 75px;
vertical-align: middle;
}
.nav-video {
width: 18px;
height: 21px;
vertical-align: sub;
text-decoration: none;
}
.nav-category {
margin: 0.2em 0;
padding-left: 2rem;
font-size: 11px;
font-weight: normal;
text-transform: uppercase;
}
.nav-button {
display: block;
width: 100%;
padding: 0.5rem;
padding-left: calc(5rem + 5px + 0.5rem); /* padding + icon + magic */
padding-top: 0.8rem;
padding-bottom: 0.8rem;
line-height: 2;
text-align: left;
font-size: 16px;
color: white;
border: none;
background-color: transparent;
outline: none;
opacity: 0.8;
cursor: pointer;
font-family: "Open Sans", sans-serif;
background-size: 30px 30px;
background-repeat: no-repeat;
background-position: 22px center;
}
.nav-button:hover,
.nav-button:focus:not(.is-selected) {
background-color: hsla(0, 0%, 0%, 0.1);
color: white;
opacity: 1;
}
.nav-button.is-selected {
background-color: var(--color-accent);
}
.nav-button.is-selected,
.nav-button.is-selected em {
color: white;
font-weight: 500;
opacity: 1;
}
.nav-button.is-selected:focus {
opacity: 1;
}
.nav-button em {
font-style: normal;
font-weight: 600;
color: var(--color-strong);
pointer-events: none; /* makes it invisible to clicks */
}
.nav-footer {
margin-top: 1rem;
padding: 2rem;
border-top: 1px solid var(--color-border);
text-align: center;
}
.nav-footer-icon {
width: calc(770px / 6.5);
height: calc(88px / 6.5);
}
.nav-footer a {
outline: none;
}
.nav-footer-button {
display: block;
width: 100%;
padding: 0;
margin-bottom: 0.75rem;
line-height: 2;
text-align: left;
font: inherit;
font-size: 15px;
color: inherit;
border: none;
background-color: transparent;
cursor: default;
outline: none;
text-align: center;
}
.nav-footer-button:focus {
color: var(--color-strong);
}
.nav-footer-logo {
color: hsl(0, 0%, 66%);
}
.nav-footer-logo:focus {
color: hsl(0, 0%, 33%);
}
/* Remove border on the logo */
.nav-footer-logo.nav-footer-logo {
border-bottom: none;
}
.nav-center-logo-image {
display: block;
margin-left: auto;
margin-bottom: 10px;
margin-top: 10px;
margin-right: auto;
width: 80px;
padding-left: 0;
}
`

export class Sidebar extends LitElement {

  static get styles() {
    return useGlobalStyles(componentCSS, sheet => sheet.href && sheet.href.includes('bootstrap'), this.shadowRoot)
  }

  constructor () {
    super()

    // const { primary, backgroundColor = null, size, label, onClick } = props ?? {}
  }

  // This method turns off shadow DOM to allow for global styles (e.g. bootstrap)
  // NOTE: This component checks whether this is active to determine how to handle styles and internal element references
  createRenderRoot() {
    return this;
  }

  updated(){
      // Toggle sidebar
      const toggle = (this.shadowRoot ?? this).querySelector("#sidebarCollapse");
      toggle.addEventListener('click', () => {
        const mainNav = (this.shadowRoot ?? this).querySelector("#main-nav");
        mainNav.classList.toggle("active");
        toggle.classList.toggle("active");

        // TODO: Decide how to grab these elements outside of the component
        const section = document.getElementsByClassName("section")[0];
        if (section) section.classList.toggle("fullShown");
      });

      this.insertAdjacentElement('beforebegin', toggle) // This is a hack to get the button to behave properly in the app styling

      // Clear all selected links and add selected class to the clicked link
      const links = (this.shadowRoot ?? this).querySelectorAll('a')
      links.forEach((a) => {
        a.addEventListener('click', () => {
          links.forEach((a) => a.classList.remove('is-selected'))
          a.classList.add('is-selected')
        })
      })

      const gettingStarted = (this.shadowRoot ?? this).querySelector("#getting_starting_tab");
      gettingStarted.click()
  }

  render() {
    return html`
    <button type="button" id="sidebarCollapse" class="navbar-btn">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav id="main-nav" class="nav js-nav">
        <div id="nav-items" class="nav-item u-category-windows">
          <!-- Sidebar Header -->
          <div class="sidebar-header">
            <div style="display: block" id="neuroconv-logo">
              <img
                id="button-neuroconv-big-icon"
                class="nav-center-logo-image"
                src="assets/img/logo-neuroconv.png"
                width="120px"
                height="75px"
              />
              <h3
                style="
                  font-size: 1.5rem;
                  color: var(--color-light-green);
                  width: auto;
                  text-align: center;
                  margin-top: 3px;
                "
              >
                <span id="version" style="font-size: 14px"></span>
              </h3>
            </div>
            <!-- Sidebar Links -->
            <ul class="list-unstyled components">
              <li>
                <a href="#" data-section="getting_started" id="getting_starting_tab">
                  <svg
                    data-section="getting_started"
                    style="margin-right: 30px; margin-bottom: -5px"
                    width="20px"
                    height="20px"
                    viewBox="0 0 16 16"
                    class="bi bi-caret-right-square-fill"
                    fill="white"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      data-section="getting_started"
                      fill-rule="evenodd"
                      d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm5.5 10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0 0-.748l-4.5-4A.5.5 0 0 0 5.5 4v8z"
                    ></path>
                  </svg>
                  Overview
                </a>
              </li>
              <li>
                <a href="#" data-section="guided_mode" id="guided_mode_view">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20px"
                    height="20px"
                    fill="white"
                    class="bi bi-compass-fill"
                    viewBox="0 0 16 16"
                    style="margin-right: 30px; margin-bottom: -5px"
                  >
                    <path
                      d="M8 16.016a7.5 7.5 0 0 0 1.962-14.74A1 1 0 0 0 9 0H7a1 1 0 0 0-.962 1.276A7.5 7.5 0 0 0 8 16.016zm6.5-7.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"
                    ></path>
                    <path d="M6.94 7.44l4.95-2.83-2.83 4.95-4.949 2.83 2.828-4.95z"></path>
                  </svg>
                  Guided Mode
                </a>
              </li>
              <li>
                <a href="#" data-section="main_tabs" id="main_tabs_view">
                  <svg
                    style="margin-right: 30px; margin-bottom: -5px"
                    width="20px"
                    height="20px"
                    viewBox="0 0 16 16"
                    class="bi bi-kanban-fill"
                    fill="white"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2h-11zm5 2h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm-5 1a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V3zm9-1h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"
                    ></path>
                  </svg>
                  Free Form Mode
                </a>
              </li>
              <li>
                <a href="#" data-section="documentation" id="documentation-view">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 448 512"
                    height="20px"
                    width="20px"
                    style="margin-right: 30px; margin-bottom: -5px"
                  >                  <path
                      d="M448 336v-288C448 21.49 426.5 0 400 0H96C42.98 0 0 42.98 0 96v320c0 53.02 42.98 96 96 96h320c17.67 0 32-14.33 32-31.1c0-11.72-6.607-21.52-16-27.1v-81.36C441.8 362.8 448 350.2 448 336zM143.1 128h192C344.8 128 352 135.2 352 144C352 152.8 344.8 160 336 160H143.1C135.2 160 128 152.8 128 144C128 135.2 135.2 128 143.1 128zM143.1 192h192C344.8 192 352 199.2 352 208C352 216.8 344.8 224 336 224H143.1C135.2 224 128 216.8 128 208C128 199.2 135.2 192 143.1 192zM384 448H96c-17.67 0-32-14.33-32-32c0-17.67 14.33-32 32-32h288V448z"
                    ></path></svg>Documentation</a>
              </li>
              <li>
                <a href="#" data-section="contact-us" id="contact-us-view">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    height="20px"
                    width="20px"
                    style="margin-right: 30px; margin-bottom: -5px"
                  >                  <path
                      d="M511.1 63.1v287.1c0 35.25-28.75 63.1-64 63.1h-144l-124.9 93.68c-7.875 5.75-19.12 .0497-19.12-9.7v-83.98h-96c-35.25 0-64-28.75-64-63.1V63.1c0-35.25 28.75-63.1 64-63.1h384C483.2 0 511.1 28.75 511.1 63.1z"
                    ></path></svg>Contact Us</a>
              </li>
            </ul>
            <div class="help-section">
              <ul
                class="list-unstyled components"
                style="
                  height: 50px;
                  margin-bottom: 0;
                  margin-left: 35px;
                  display: flex;
                  flex-direction: row;
                  justify-content: center;
                "
              ></ul>
            </div>
          </div>
          <!-- Sidebar Footer -->
          <div class="boxhead">
            <div style="display: block" id="catalystneuro-logo">
              <h3
                style="
                  width: auto;
                  text-align: center;
                "
              >
                <a
                  href="https://catalystneuro.com/"
                  style="border-bottom:0px;text-decoration:none;"
                >
                  <img
                    src="assets/img/logo-catalystneuro.png"
                    width="140px"
                    height="140px"
                    border="0"
                  />
                </a>
              </h3>
            </div>
        </div>
      </nav>
    `;
  }
};

customElements.get('nwb-sidebar') || customElements.define('nwb-sidebar',  Sidebar);
