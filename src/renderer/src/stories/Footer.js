import { LitElement, html, css } from 'lit';

export class Footer extends LitElement {

  static get styles() {
    return css`
      :host {
        background: white;
        padding: 10px 25px;
        border-top: 1px solid #c3c3c3;
        width: 100%;
      }
    `
  }

  constructor() {
    super()
  }

  render() {
    return html`
        <slot></slot>
    `;
  }
};

customElements.get('nwb-footer') || customElements.define('nwb-footer', Footer);
