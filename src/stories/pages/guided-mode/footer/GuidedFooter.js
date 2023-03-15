import { html } from 'lit';
import { Page } from '../../Page.js';

export class GuidedFooter extends Page {

    static get properties() {
        return {
          back: { type: Function, reflect: false },
          next: { type: Function, reflect: true },
          exit: { type: Boolean, reflect: true },
        };
      }
    
      constructor (props = {}) {
        super()
      }
    
      // This method turns off shadow DOM to allow for global styles (e.g. bootstrap)
      // NOTE: This component checks whether this is active to determine how to handle styles and internal element references
      createRenderRoot() {
        return this;
      }
    
      attributeChangedCallback(...args) {
        const attrs = ['back', 'next', 'exit']
        super.attributeChangedCallback(...args)
        if (attrs.includes(args[0])) this.requestUpdate()
      }
    

  updated(){

  }

  render() {

    return html`
    <slot></slot>
    `;
  }
};

customElements.get('nwbguide-guided-footer') || customElements.define('nwbguide-guided-footer',  GuidedFooter);