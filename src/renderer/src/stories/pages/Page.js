

import { LitElement, html } from 'lit';
import useGlobalStyles from '../utils/useGlobalStyles.js';
import { runConversion } from './guided-mode/options/utils.js';
import { get, save } from '../../progress.js'
import { dismissNotification, notify } from '../../globals.js';

const randomizeIndex = (count) => Math.floor(count * Math.random())

const randomizeElements = (array, count) => {
  if (count > array.length) throw new Error('Array size cannot be smaller than expected random numbers count.');
  const result = [];
  const guardian = new Set();
  while (result.length < count) {
      const index = randomizeIndex(array.length);
      if (guardian.has(index)) continue;
      const element = array[index];
      guardian.add(index);
      result.push(element);
  }
  return result;
};

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

  merge = (path, toMerge = {}, target =  this.info.globalState) => {

    if (!Array.isArray(path)) path = path.split('.')

    const key = path.pop() // Focus on the last key in the path
    path.forEach(key => target = target[key])

    // Deep merge objects
    if (key in target) {
      for (const [k, v] of Object.entries(toMerge)) {
        if (typeof v === 'object' && !Array.isArray(v)) {
          if (!target[key][k]) target[key][k] = v
          else this.merge(`${k}`, v, target[key])
        }
        else target[key][k] = v
      }
    } else target[key] = toMerge
  }

  addSession ({ subject, session, info }) {
    if (!this.info.globalState.results[subject]) this.info.globalState.results[subject] = {}
    if (this.info.globalState.results[subject][session]) throw new Error(`Session ${subject}/${session} already exists.`)
    info = this.info.globalState.results[subject][session] = info ?? {}
    if (!info.metadata) info.metadata = {}
    if (!info.source_data) info.source_data = {}
    return info
  }

  removeSession ({ subject, session }) {
    delete this.info.globalState.results[subject][session]
  }

  mapSessions(callback = (v) => v) {
    return Object.entries(this.info.globalState.results).map(([subject, sessions]) => {
      return Object.entries(sessions).map(([session, info]) => callback({ subject, session, info }))
    }).flat(2)
  }

  async runConversions (conversionOptions = {}, toRun) {
    let original = toRun
    if (!Array.isArray(toRun)) toRun = this.mapSessions()

    // Filter the sessions to run
    if (typeof original === 'number') toRun = randomizeElements(toRun, original) // Grab a random set of sessions
    else if (typeof original === 'string') toRun = toRun.filter(({ subject }) => subject === original)
    else if (typeof original === 'function') toRun = toRun.filter(original)

    const folder = this.info.globalState.conversion.info.output_folder
    let results = []

    for (let { subject, session } of toRun) {
      const file = `${folder}/sub-${subject}/sub-${subject}_ses-${session}.nwb`
      const result = await runConversion({
        folder,
        nwbfile_path: file,
        overwrite: true, // We assume override is true because the native NWB file dialog will not allow the user to select an existing file (unless they approve the overwrite)
        ...this.info.globalState.results[subject][session], // source_data and metadata are passed in here
        ...conversionOptions, // Any additional conversion options override the defaults

        interfaces: this.info.globalState.interfaces
      }) .catch(e => {
        this.notify(e.message, 'error')
        throw e.message
      })

      results.push({ file, result })
    }

    return results

  }

//   NOTE: Until the shadow DOM is supported in Storybook, we can't use this render function how we'd intend to.
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
