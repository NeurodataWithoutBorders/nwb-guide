import { LitElement, css } from "lit";
import { getTimezoneOffset, formatTimezoneOffset } from "../../../../schemas/timezone.schema";


// Function to format the GMT offset
function formatOffset(date) {
    let offset = -date.getTimezoneOffset(); // getTimezoneOffset returns the difference in minutes from UTC
    const sign = offset >= 0 ? "+" : "-";
    offset = Math.abs(offset);
    const hours = String(Math.floor(offset / 60)).padStart(2, "0");
    const minutes = String(offset % 60).padStart(2, "0");
    return `${sign}${hours}:${minutes}`;
}

export function extractISOString(
    date,
    {
        // timezone = false,
        offset = false,
    } = {}
) {

    // Extract the GMT offset
    const offsetMs = getTimezoneOffset(date)
    const gmtOffset = formatTimezoneOffset(offsetMs)

    // Format the date back to the original format with GMT offset
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    // Recreate the ISO string with the GMT offset
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    return offset ? formattedDate + gmtOffset : formattedDate;
}

export const renderDateTime = (value) => {
    if (typeof value === "string") return extractISOString(new Date(value));
    else if (value instanceof Date) return extractISOString(value)
    return value;
};

export const resolveDateTime = renderDateTime;
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

    get value() {
        const date = new Date(this.input.value);
        const resolved = resolveDateTime(date);

        console.log(this.input.value, resolved)
        // return this.input.value;
        return resolved
    }
    

    set value(newValue) {
        const date = newValue ? new Date(newValue) : new Date()
        if (!newValue) date.setHours(0, 0, 0, 0);
        this.input.value = resolveDateTime(date);

    }
    get min() {
        return this.input.min;
    }

    set min(value) {
        this.input.min = value;
    }

    get max() {
        return this.input.max;
    }

    set max(value) {
        this.input.max = value;
    }

    constructor({ value, min, max } = {}) {
        super();
        this.input = document.createElement("input");
        this.input.type = "datetime-local";
        this.input.min = min;
        this.input.max = max;

        this.addEventListener("click", () => {
            this.input.focus();
            this.input.showPicker();
        });

        this.value = value ? convertToDateTimeLocalString(value) : value;
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
