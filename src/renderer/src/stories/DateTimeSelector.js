import { LitElement, css } from "lit";

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
        this.input.value = newValue;
    }

    constructor() {
        super();
        this.input = document.createElement("input");
        this.input.type = "datetime-local";

        this.addEventListener("click", (e) => {
            this.input.focus();
            this.input.showPicker();
        });
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
