import { LitElement, html, css } from 'lit';
import '../../Footer';
import '../../Button'

// NOTE: Must be set with the page's onTransition function
export class GuidedFooter extends LitElement {

  static get styles() {
    return css`
      :host {
        display: flex;
        position: absolute;
        bottom: 0;
        width: 100%;
      }
    `
  }

  static get properties() {
    return {
      back: { type: String, reflect: true },
      next: { type: String, reflect: true },
      exit: { type: String, reflect: true },
      onBack: { type: Function, reflect: false },
      onNext: { type: Function, reflect: false },
      onExit: { type: Function, reflect: false },
    };
  }

  constructor({
    back = "Back", 
    next = "Next", 
    exit = "Exit", 
    onBack = () => this.onTransition(-1),
    onNext = () => this.onTransition(1),
    onExit = () => this.onTransition('/'),
  } = {}) {
    super()
    this.back = back;
    this.next = next;
    this.exit = exit;
    this.onBack = onBack;
    this.onNext = onNext;
    this.onExit = onExit;
  }

  updated(){
    this.onTransition = this.parentElement.onTransition;
  }

  render() {
    return html`
    <nwb-footer style="display: flex; align-items: center; justify-content: space-between;">
        <div>
            <nwb-button @click=${this.onBack}>${this.back}</nwb-button>
            <nwb-button @click=${this.onNext} primary>${this.next}</nwb-button>
        </div>
        <nwb-button @click=${this.onExit}>${this.exit}</nwb-button>
    </nwb-footer>
    `;
  }
};

customElements.get('nwb-guided-footer') || customElements.define('nwb-guided-footer', GuidedFooter);
