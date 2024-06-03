import { LitElement, css } from "lit";

export function extractISOString(
    date,
    {
        // timezone = false,
        offset = false,
    } = {}
) {
    // Function to format the GMT offset
    function formatOffset(date) {
        let offset = -date.getTimezoneOffset(); // getTimezoneOffset returns the difference in minutes from UTC
        const sign = offset >= 0 ? "+" : "-";
        offset = Math.abs(offset);
        const hours = String(Math.floor(offset / 60)).padStart(2, "0");
        const minutes = String(offset % 60).padStart(2, "0");
        return `${sign}${hours}:${minutes}`;
    }

    // Extract the GMT offset
    const gmtOffset = formatOffset(date);

    // Format the date back to the original format with GMT offset
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    // Recreate the ISO string with the GMT offset
    let formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    if (offset) formattedDate += gmtOffset;

    return formattedDate;
}

export class DateTimeSelector extends LitElement {
    static get styles() {
        return css`
            :host {
                display: inline-block;
                position: relative;
            }
        `;
    }

    // Manually handle value property
    get value() {
        const date = new Date(this.input.value);
        return extractISOString(date, { offset: true });
    }

    // Render the date without timezone offset
    set value(newValue) {
        if (newValue) this.input.value = extractISOString(new Date(newValue));
        else {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            this.input.value = extractISOString(d);
        }
    }

    static get properties() {
        return {
            min: { type: String, reflect: true },
            max: { type: String, reflect: true },
            timezone: { type: String, reflect: true },
        };
    }

    constructor({ value, min, max } = {}) {
        super();
        this.input = document.createElement("input");
        this.input.type = "datetime-local";

        this.min = min;
        this.max = max;

        this.addEventListener("click", () => {
            this.input.focus();
            this.input.showPicker();
        });

        this.value = value;
    }

    focus() {
        this.click();
    }

    blur() {
        this.input.blur();
    }

    render() {
        this.input.min = min;
        this.input.max = max;

        return this.input;
    }
}

customElements.get("date-time-selector") || customElements.define("date-time-selector", DateTimeSelector);
