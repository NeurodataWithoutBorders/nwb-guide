import { LitElement, html, css } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';


export class Button extends LitElement {
  constructor({ primary, label, backgroundColor = null, size, onClick } = {}) {
    super();
    this.label = label;
    this.primary = primary;
    this.backgroundColor = backgroundColor;
    this.size = size;
    this.onClick = onClick;
  }

  static get styles() {
    return css`
    .storybook-button {
      font-family: 'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-weight: 700;
      border: 0;
      border-radius: 5px;
      cursor: pointer;
      display: inline-block;
      line-height: 1;
    }
    .storybook-button--primary {
      color: white;
      background-color: hsl(190, 60%, 36%);
    }
    .storybook-button--secondary {
      color: #333;
      background-color: transparent;
      box-shadow: rgba(0, 0, 0, 0.15) 0px 0px 0px 1px inset;
    }
    .storybook-button--small {
      font-size: 12px;
      padding: 10px 16px;
    }
    .storybook-button--medium {
      font-size: 14px;
      padding: 11px 20px;
    }
    .storybook-button--large {
      font-size: 16px;
      padding: 12px 24px;
    }
`;
  }

  static get properties() {
    return {
      primary: { type: Boolean },
      backgroundColor: { type: String },
      size: { type: String },
      onClick: { type: Function },
      label: { type: String },
    };
  }

  render() {
    const mode = this.primary ? 'storybook-button--primary' : 'storybook-button--secondary';

    return html`
      <button
        type="button"
        class=${['storybook-button', `storybook-button--${this.size || 'medium'}`, mode].join(' ')}
        style=${styleMap({ backgroundColor: this.backgroundColor })}
        @click=${this.onClick}
      >
        <slot>${this.label ?? ''}</slot>
      </button>
    `;
  }

}

customElements.get('nwb-button') || customElements.define('nwb-button',  Button);
