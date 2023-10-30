import { LitElement, css } from "lit";


const convertToDateTimeLocalString = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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

    get value() {
        return this.input.value;
    }

    set value(newValue) {
        if (newValue) this.input.value = newValue;
        else {
            const d = new Date();
            d.setHours(0,0,0,0);
            this.input.value = convertToDateTimeLocalString(d)
        }
    }

    constructor({
        value
    } = {}) {
        super();
        this.input = document.createElement("input");
        this.input.type = "datetime-local";

        this.addEventListener("click", (e) => {
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
