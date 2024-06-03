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

export const renderDateTime = (value) => {
    if (typeof value === "string") return extractISOString(new Date(value));
    return value;
}

export const resolveDateTime = renderDateTime
// const resolveDateTime = (value) => {
//     if (typeof value === "string") return extractISOString(new Date(value), { offset: true });
//     return value;
// } 


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
        return resolveDateTime(date);
    }

    // Render the date without timezone offset
    set value(newValue) {
        if (newValue) this.input.value = renderDateTime(new Date(newValue));
        else {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            this.input.value = renderDateTime(d);
        }
    }

    get min() {
        return this.input.min
    }

    set min(value) {
        this.input.min = value
    }

    get max() {
        return this.input.max
    }

    set max(value) {
        this.input.max = value
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
        return this.input;
    }
}

customElements.get("date-time-selector") || customElements.define("date-time-selector", DateTimeSelector);
