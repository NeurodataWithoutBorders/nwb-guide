import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

import { LitElement, html } from 'lit';

export class Table extends LitElement {

  validateOnChange

  constructor({ schema, data, validateOnChange } = {}) {
    super();
    this.schema = schema ?? {}
    this.data = data ?? [];
    if (validateOnChange) this.validateOnChange = validateOnChange
  }

  static get properties() {
    return {
      data: { type: Object, reflect: true },
    };
  }

  createRenderRoot() {
    return this;
  }


  updated() {
    const div = this.querySelector('div');

    const entries = this.schema.properties
    const entriesArr = Object.values(entries)
    const colHeaders = Object.keys(entries)
    const rowHeaders = Object.keys(this.data)
    const columns = colHeaders.map(k => {

      const info = { type: 'text' }

      // Enumerate Possible Values
      if (entries[k].enum) {
        info.source = entries[k].enum
        info.type = 'dropdown'
      }

      // Constrain to Date Format
      if (entries[k].format === 'date-time') {
        info.type = 'date'
        info.correctFormat = false
      }

      // Validate Regex Pattern
      if (entries[k].pattern){
        const regex = new RegExp(entries[k].pattern)
        info.validator = (value, callback) => callback(regex.test(value))
      }

      if (this.validateOnChange) {
        if (info.validator) {
          const oldValidator = info.validator
          info.validator = (value, callback) => oldValidator(value, callback) && this.validateOnChange(value)
        }
        else info.validator = (value, callback) => callback(this.validateOnChange(value))
      }

      return info
    })

    const data = rowHeaders.map((row) => colHeaders.map((col, i) => this.data[row][col] ?? entriesArr[i].default ?? ''))

    const table = new Handsontable(div, {
      data,
      rowHeaders,
      colHeaders,
      columns,
      height: 'auto',
      licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
    });

    this.table = table;

    table.addHook('afterValidate', (isValid, value, row, prop) => {
      if (isValid) this.data[rowHeaders[row]][colHeaders[prop]] = value // Update data on passed object
    })

  }

  render() {
    return html`<div></div>`;
  }

}

customElements.get('nwb-table') || customElements.define('nwb-table',  Table);
