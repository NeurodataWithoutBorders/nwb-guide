import { LitElement, html, css } from "lit";

export type OverlayProps = {
  open?: boolean;
};

export class Overlay extends LitElement {
  static get styles() {
    return css`
      :host {
        font-family: var(--visualscript-font-family, sans-serif);
        opacity: 0;
        width: 100vw;
        height: 100vh;
        transition: 1s;
        position: fixed;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 50;
        color: black;
      }

      :host([open]) {
        opacity: 1;
        pointer-events: all;
        backdrop-filter: blur(3px);
      }
    `;
  }

  static get properties() {
    return {
      open: {
        type: Boolean,
        reflect: true,
      },
    };
  }

  declare open: boolean;

  constructor(props: OverlayProps = {}) {
    super();

    this.open = props.open ?? false;
  }

  render() {
    return html`<slot></slot>`;
  }
}

customElements.get("nwb-overlay") || customElements.define("nwb-overlay", Overlay);
