import { LitElement, html, css } from 'lit';
import './Button'
import './Overlay'

export interface ModalProps {
  open?: boolean;
  header?: string;
  footer?: string;
  onClick?: () => void;
  onClose?: () => void;
  onOpen?: () => void;
}

export class Modal extends LitElement {

  static get styles() {
    return css`
/* Modal Header */

  :host {
    font-family: var(--visualscript-font-family, sans-serif);
    z-index: 101;
  }

  :host * {
    box-sizing: border-box;

  }

.modal-header {
  padding: 12px 16px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border-bottom: 1px solid #e3e3e3;
}

.modal-header span {
  font-weight: 800;
  font-size: 120%;
}


/* Modal Body */
.modal-body {
  overflow-y: scroll;
  width: 100%;
  flex-grow: 1;
}

/* Modal Footer */
.modal-footer {
  border-top: 1px solid #e3e3e3;
  padding: 12px 16px;
  width: 100%;
}

.modal-footer span {
  font-size: 80%;
}

/* Modal Content */
.modal-content {

  position: absolute;
  bottom: 50%;
  left: 50%;
  transform: translate(-50%, 50%);

  background-color: #fefefe;
  margin: auto;
  border-radius: 4px;
  padding: 0;
  width: 80vw;
  height: 80vh;
  box-shadow: 0 1px 5px 0 rgb(0 0 0 / 20%);
  transition: opacity 0.5s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
  pointer-events: none;
  z-index: 102;
  opacity: 0;
}

.modal-content.open {
  opacity: 1;
  pointer-events: all;
}

    `;
  }

    static get properties() {
      return {
        open:  {
          type: Boolean,
          reflect: true
        },
         header:  {
          type: Object,
          reflect: true
        },
         footer:  {
          type: String,
          reflect: true
        },
      };
    }

    declare open: ModalProps['open']
    declare header: ModalProps['header']
    declare footer: ModalProps['footer']
    onClose: ModalProps['onClose']
    onOpen: ModalProps['onOpen']

    constructor(props: ModalProps = {}) {
      super();

      this.open = props.open ?? false
      this.header = props.header ?? ''
      this.footer = props.footer ?? ''
      this.onClose = props.onClose

    }

    toggle = (force?:boolean) => {
      this.open = (force !== undefined && typeof force === 'boolean') ? force : !this.open

      if (!this.open) {
        if (this.onClose instanceof Function) this.onClose()
      } else {
        if (this.onOpen instanceof Function) this.onOpen()
      }

    }

    render() {

      const span = document.createElement('span')
      span.innerHTML = this.footer ?? ''
      return html`
      <nwb-overlay .open=${this.open}>
        <div class="modal-content ${this.open ? 'open' : ''}">
        <div class="modal-header">
            <span>${this.header}</span>
            <nwb-button secondary size="extra-small" @click="${this.toggle}">Close</nwb-button>
          </div>
          <div class="modal-body">
            <slot>No content</slot>
          </div>
          ${(this.footer) ? html`<div class="modal-footer">${span}</div>` : ''}
        </div>
      </nwb-overlay>
    `
    }
  }

  customElements.get('nwb-modal') || customElements.define('nwb-modal',  Modal);
