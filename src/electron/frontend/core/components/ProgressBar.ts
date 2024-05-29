

import { LitElement, html, css, unsafeCSS } from 'lit';

export type ProgressProps = {
    size?: string,

    isBytes?: boolean,

    format?: {
        n: number,
        total: number,
        [key: string]: any,
    }
}

export function humanReadableBytes(size: number | string) {

    // Define the units
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    // Initialize the index to 0
    let index = 0;

    // Convert the size to a floating point number
    size = parseFloat(size);

    // Loop until the size is less than 1024 and increment the unit
    while (size >= 1024 && index < units.length - 1) {
        size /= 1024;
        index += 1;
    }

    // Return the size formatted with 2 decimal places and the appropriate unit
    return `${size.toFixed(2)} ${units[index]}`;
}


const animationDuration = 500 // ms

export class ProgressBar extends LitElement {

    static animationDuration = animationDuration // ms

    static get styles() {

        return css`

            /* Small Bar */

            .bar > div {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 10px;
            }

            .bar label {
              font-size: 0.85rem;
              font-weight: bold;
              margin-bottom: 5px;
            }

            .progress {
              height: 10px;
              width: 100%;
              border: 1px solid lightgray;
            }

            .progress div {
              height: 100%;
              background-color: #029CFD;
              width: 0%;
              transition: width ${unsafeCSS((animationDuration / 1000).toFixed(2))}s;
            }


            small {
              font-size: 0.8rem;
              color: gray;
              width: min-content;
              white-space: nowrap;
            }

            :host([size="small"]) > .progress {
                height: 5px;
            }

            :host([size="small"]) small {
                font-size: 0.7rem;
            }

            :host([size="small"]) .progress:last-child {
                border-bottom: none;
            }
        `
    }


    static get properties() {
        return {
            format: {
                type: Object,
                reflect: true,
            },
            size: {
                type: String,
                reflect: true,
            }
        };
    }

    declare format: any
    declare size: string
    declare isBytes: boolean


    constructor(props: ProgressProps = {}) {
        super();
        this.size = props.size ?? 'medium'
        this.format = props.format ?? {}
        this.isBytes = props.isBytes ?? false
        if (!('n' in this.format)) this.format.n = 0
        if (!('total' in this.format)) this.format.total = 0
    }

    render() {

        const percent = this.format.total ? 100 * (this.format.n / this.format.total) : 0;
        const remaining = this.format.rate && this.format.total ? (this.format.total - this.format.n) / this.format.rate : 0; // Seconds

        const numerator = this.isBytes ? humanReadableBytes(this.format.n) : this.format.n
        const denominator = this.isBytes ? humanReadableBytes(this.format.total) : this.format.total


        const elapsed = this.format.elapsed

        let subMessage = ''
        if ('elapsed' in this.format && 'rate' in this.format) subMessage = `${elapsed?.toFixed(1)}s elapsed, ${remaining.toFixed(1)}s remaining`
        else if ('elapsed' in this.format) subMessage = `${elapsed?.toFixed(1)}s elapsed`
        else if ('rate' in this.format) subMessage = `${remaining.toFixed(1)}s remaining`

        return html`
        <div class="bar">
            ${this.format.prefix ? html`<div>
                <label>${this.format.prefix || ''}</label>
            </div>` : ''}
            <div>
                <div class="progress">
                    <div style="width: ${percent}%"></div>
                </div>
                <small>${numerator} / ${denominator} (${percent.toFixed(1)}%)</small>
            </div>
            <div>
            ${subMessage ? html`<small>${subMessage}</small>` : ''}
            </div>
        </div>
        `;
    }
}

customElements.get('nwb-progress') || customElements.define('nwb-progress', ProgressBar);
