

import { LitElement, html } from 'lit';
import useGlobalStyles from '../utils/useGlobalStyles.js';
import { get, save } from '../../progress.js'
import { dismissNotification, notify } from '../../globals.js';

const componentCSS = `

`

export class Page extends LitElement {

  static get styles() {
    return useGlobalStyles(componentCSS, sheet => sheet.href && sheet.href.includes('bootstrap'), this.shadowRoot)
  }

  info = { globalState: {} }

  constructor (info = {}) {
    super()
    Object.assign(this.info, info)
  }

  createRenderRoot() {
    return this;
  }

  query = (input) => {
    return (this.shadowRoot ?? this).querySelector(input);
  }

  onSet = () => {} // User-defined function

  set = (info) => {
    if (info){
      Object.assign(this.info, info)
      this.onSet()
      this.requestUpdate()
    }
  }

  #notifications = []

  dismiss = (notification) => {
    if (notification) dismissNotification(notification)
    else {
      this.#notifications.forEach(notification => dismissNotification(notification))
      this.#notifications = []
    }
  }

  notify = (...args) => {
    const note = notify(...args)
    this.#notifications.push(note)
  }

  onTransition = () => {} // User-defined function
  updatePages = () => {} // User-defined function

  save = (overrides) => save(this, overrides)

  load = (datasetNameToResume = new URLSearchParams(window.location.search).get('project')) => this.info.globalState = get(datasetNameToResume)

  addPage = (id, subpage) => {
    if (!this.info.pages) this.info.pages = {}
    this.info.pages[id] = subpage
    this.updatePages()
  }

  render() {
    return html`<slot></slot>`;
  }
};

customElements.get('nwbguide-page') || customElements.define('nwbguide-page',  Page);
