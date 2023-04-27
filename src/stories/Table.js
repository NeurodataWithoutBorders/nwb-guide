import { LitElement, html } from 'lit';
import './Button';
import { notify } from '../globals';
import { Handsontable } from './hot';

export class Table extends LitElement {

  validateOnChange

  constructor({ schema, data, template, keyColumn, validateOnChange } = {}) {
    super();
    this.schema = schema ?? {}
    this.data = data ?? [];
    this.keyColumn = keyColumn ?? 'id'
    this.template = template ?? {}
    if (validateOnChange) this.validateOnChange = validateOnChange

    this.style.width = '100%';
    this.style.display = 'flex';
    this.style.flexWrap = 'wrap';
    this.style.alignItems = 'center';
    this.style.justifyContent = 'center';

    // Inject scoped stylesheet
    const style = `
      ul {
        list-style-type: none;
        padding: 0;
      }
      
      ul li:before {
        content: '-';
        position: absolute;
        margin-left: -20px;
      }
    `

    const styleEl = document.createElement('style');
    styleEl.innerHTML = style;
    this.appendChild(styleEl);

  }

  static get properties() {
    return {
      data: { type: Object, reflect: true },
    };
  }

  createRenderRoot() {
    return this;
  }

  #getRowData(row, cols = this.colHeaders) {

    const hasRow = row in this.data
    return cols.map((col, j) => {
      let value;
      if (col === this.keyColumn) {
        if (hasRow) value = row
        else return ''
      } else value = (hasRow ? this.data[row][col] : undefined) ?? this.template[col] ?? this.schema.properties[col].default ?? ''
      return value
    })
  }

  #getData(rows=this.rowHeaders, cols=this.colHeaders) {
    return rows.map((row, i) => this.#getRowData(row, cols))
  }


  updated() {
    const div = this.querySelector('div');

    const entries = this.schema.properties

    // Sort Columns by Key Column and Requirement
    const colHeaders = this.colHeaders = Object.keys(entries).sort((a, b) => {
      if (a === this.keyColumn) return -1
      if (b === this.keyColumn) return 1
      if (entries[a].required && !entries[b].required) return -1
      if (!entries[a].required && entries[b].required) return 1
      return 0
    })

    const rowHeaders = this.rowHeaders = Object.keys(this.data)

    const displayHeaders = [...colHeaders]

    const columns = colHeaders.map((k, i) => {

      const info = { type: 'text' }

      if (entries[k].unit) displayHeaders[i] = `${k} (${entries[k].unit})`

      // Enumerate Possible Values
      if (entries[k].enum) {
        info.source = entries[k].enum
        info.type = 'dropdown'
      }

      // Constrain to Date Format
      if (entries[k].format === 'date-time') {
        info.type = 'date-time'
        info.correctFormat = false
      }

      if (entries[k].type === 'array') {
        info.data = k
        info.type = 'array'
        info.uniqueItems = entries[k].uniqueItems
      }

      // Validate Regex Pattern
      if (entries[k].pattern){
        const regex = new RegExp(entries[k].pattern)
        info.validator = (value, callback) => callback(regex.test(value))
      }

      const runThisValidator = async (value, row) => {
        const valid = this.validateOnChange ? await this.validateOnChange(k, this.data[rowHeaders[row]], value) : true
        let warnings = Array.isArray(valid) ? valid.filter((info) => info.type === 'warning') : []
        const errors = Array.isArray(valid) ? valid?.filter((info) => info.type === 'error') : []
        return (valid === true || valid == undefined || errors.length === 0)
      }

      if (info.validator) {
        const og = info.validator
        info.validator = async function (value, callback) {
          if (!value) return callback(true) // Allow empty values
          if (!await runThisValidator(value, this.row)) return callback(false)
          og(value, callback)
        }
      } else {
        info.validator = async function (value, callback) {
          if (!value) return callback(true) // Allow empty values
          callback(await runThisValidator(value, this.row))
        }
      }

      return info
    })

    const data = this.#getData()

    let nRows = rowHeaders.length

    const table = new Handsontable(div, {
      data,
      // rowHeaders: rowHeaders.map(v => `sub-${v}`),
      colHeaders: displayHeaders,
      columns,
      height: 'auto',
      width: '100%',
      contextMenu: ['row_below', 'remove_row'],//, 'row_above', 'col_left', 'col_right', 'remove_row', 'remove_col'],
      licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
    });

    this.table = table;

    const unresolved = {}

    table.addHook('afterValidate', (isValid, value, row, prop) => {

      const header = typeof prop === 'number' ? colHeaders[prop] : prop
      const rowName = rowHeaders[row]

      if (isValid) {

        const isResolved = rowName in  this.data
        let target = isResolved ? this.data : unresolved

        if (!isResolved && !unresolved[rowName]) unresolved[rowName] = {}

        // Transfer data to object
        if (header === this.keyColumn) {
          if (value !== rowName){
            const old = target[rowName] ?? {}
            this.data[value] = old
            delete target[rowName]
            rowHeaders[row] = value
          }
        }

        // Update data on passed object
        else {
          if (value == undefined && value === '') delete target[rowName][header]
          else target[rowName][header] = value
        }
      }
    })

    // If only one row, do not allow deletion
    table.addHook('beforeRemoveRow', (index, amount) => {
      if (nRows - amount < 1) {
        notify('You must have at least one row', 'error')
        return false
      }
    })

    table.addHook('afterRemoveRow', (_, amount, physicalRows) => {
      nRows -= amount
      physicalRows.forEach(row => delete this.data[rowHeaders[row]])
    })


    table.addHook('afterCreateRow', (index, amount) => {
      nRows += amount
      const physicalRows = Array.from({length: amount}, (e, i) => index + i)
      physicalRows.forEach(row => this.#setRow(row, this.#getRowData(row)))
    })

    // Trigger validation on all cells
    data.forEach((row, i) => this.#setRow(i, row))

  }

  #setRow(row, data) {
    data.forEach((value, j) => {
      if (value !== '') this.table.setDataAtCell(row, j, value)
    })
  }


  render() {
    return html`
      <div></div>
      <nwb-button style="margin-top: 25px;" @click=${() => this.table.alter("insert_row_below")}>Add New Row</nwb-button>
    `;
  }

}

customElements.get('nwb-table') || customElements.define('nwb-table',  Table);
