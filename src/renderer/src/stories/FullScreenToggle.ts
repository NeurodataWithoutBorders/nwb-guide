import { LitElement, css, html } from "lit";

import fullScreenIcon from './assets/fullscreen.svg?raw'
import fullScreenExitIcon from './assets/fullscreen_exit.svg?raw'

import { unsafeHTML } from "lit/directives/unsafe-html.js";

type FullScreenToggleProps = {
    target: HTMLElement | (() => HTMLElement);
}

export class FullScreenToggle extends LitElement {
    static get styles() {
        return css`
            :host {
                display: flex;
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 10px;
                color: white;
                background-color: gainsboro;
                border: 1px solid gray;
                border-radius: 10px;    
                cursor: pointer;
                box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.3);
                z-index: 1000;
            }
        `;
    }

    static get properties() {
        return {
            icon: { type: String },
        };
    }

    declare icon: string;
    declare target: FullScreenToggleProps['target'];

    constructor({ target }: FullScreenToggleProps) {

        super();
        this.target = target;
        this.icon = fullScreenIcon

        const fullscreenchanged = () => this.icon = document.fullscreenElement ? fullScreenExitIcon : fullScreenIcon

        this.addEventListener('click', () => {
            const target = (typeof this.target === 'function' ? this.target() : this.target)

              target.addEventListener("fullscreenchange", fullscreenchanged);
              
              const fullScreenEl = document.fullscreenElement
              if (!fullScreenEl) target.requestFullscreen()
              else  document.exitFullscreen()

        })
    }

    render() {
        return html`${unsafeHTML(this.icon)}`;
    }
}

customElements.get("fullscreen-toggle") || customElements.define("fullscreen-toggle", FullScreenToggle);

