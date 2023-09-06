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
  showCloseButton?: boolean,
  width?: string
  height?: string
}

export class Modal extends LitElement {

  static get styles() {
    return css`
/* Modal Header */

  :host {
    font-family: var(--visualscript-font-family, sans-serif);
    z-index: 1000;
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
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}


/* Modal Body */
.modal-body {
  overflow-y: auto;
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

  width: 100%;
  max-width: 80vw;
  max-height: 80vh;

  background-color: #fefefe;
  margin: auto;
  border-radius: 4px;
  padding: 0;
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
          reflect: false
        },
         footer:  {
          type: Object,
          reflect: false
        },
        showCloseButton: {
          type: Boolean,
          reflect: true
        },
        width: {
          type: String,
          reflect: true
        },
        height: {
          type: String,
          reflext: true
        }
      };
    }

    declare open: ModalProps['open']
    declare header: ModalProps['header']
    declare footer: ModalProps['footer']
    onClose: ModalProps['onClose']
    onOpen: ModalProps['onOpen']
    declare showCloseButton: ModalProps['showCloseButton']
    declare width: ModalProps['width']
    declare height: ModalProps['height']

    constructor(props: ModalProps = {}) {
      super();

      this.open = props.open ?? false
      this.header = props.header ?? ''
      this.footer = props.footer ?? ''
      this.onClose = props.onClose
      this.onOpen = props.onOpen
      this.showCloseButton = props.showCloseButton ?? true

      this.width = props.width
      this.height = props.height
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

      return html`
      <nwb-overlay .open=${this.open}>
        <div class="modal-content ${this.open ? 'open' : ''}" style="${this.width ? `width: ${this.width};` : ''} ${this.height ? `height: ${this.height};` : ''}">
          <div class="modal-header">
              <span title="${this.header}">${this.header}</span>
              ${this.showCloseButton ? html`<nwb-button secondary size="extra-small" @click="${this.toggle}">Close</nwb-button>` : ''}
            </div>
            <div class="modal-body">
              <slot>No content</slot>
            </div>
            ${this.footer ? html`<div class="modal-footer"><span>${this.footer}</span></div>` : ''}
        </div>
      </nwb-overlay>
    `
    }
  }

  customElements.get('nwb-modal') || customElements.define('nwb-modal',  Modal);
