import { LitElement, css, html } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

// From https://loading.io/css/

export class Loader extends LitElement {

    static get styles() {
        return css`

        :host {
          display: block;
        }

        span {
          font-size: 90%;
          padding-left: 10px;
        }

        :host > div {
          display: flex;
          align-items: center;
          justif-content: center;
        }


        .lds-default {
            display: inline-block;
            position: relative;
            width: 80px;
            height: 80px;
          }

          .lds-default div {
            position: absolute;
            width: 6px;
            height: 6px;
            background: var(--loader-color);
            border-radius: 50%;
            animation: lds-default 1.2s linear infinite;
          }
          .lds-default div:nth-child(1) {
            animation-delay: 0s;
            top: 37px;
            left: 66px;
          }
          .lds-default div:nth-child(2) {
            animation-delay: -0.1s;
            top: 22px;
            left: 62px;
          }
          .lds-default div:nth-child(3) {
            animation-delay: -0.2s;
            top: 11px;
            left: 52px;
          }
          .lds-default div:nth-child(4) {
            animation-delay: -0.3s;
            top: 7px;
            left: 37px;
          }
          .lds-default div:nth-child(5) {
            animation-delay: -0.4s;
            top: 11px;
            left: 22px;
          }
          .lds-default div:nth-child(6) {
            animation-delay: -0.5s;
            top: 22px;
            left: 11px;
          }
          .lds-default div:nth-child(7) {
            animation-delay: -0.6s;
            top: 37px;
            left: 7px;
          }
          .lds-default div:nth-child(8) {
            animation-delay: -0.7s;
            top: 52px;
            left: 11px;
          }
          .lds-default div:nth-child(9) {
            animation-delay: -0.8s;
            top: 62px;
            left: 22px;
          }
          .lds-default div:nth-child(10) {
            animation-delay: -0.9s;
            top: 66px;
            left: 37px;
          }
          .lds-default div:nth-child(11) {
            animation-delay: -1s;
            top: 62px;
            left: 52px;
          }
          .lds-default div:nth-child(12) {
            animation-delay: -1.1s;
            top: 52px;
            left: 62px;
          }
          @keyframes lds-default {
            0%, 20%, 80%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.5);
            }
          }
        `
    }

    declare message: string

    constructor(props: any){
        super()
        Object.assign(this, props)
    }

    render() {
        return html`
          <div>
          <div class="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
          ${this.message ? html`<span>${unsafeHTML(this.message)}</span>` : ''}
          </div>
      `
    }
}

customElements.get("nwb-loader") || customElements.define("nwb-loader", Loader);
