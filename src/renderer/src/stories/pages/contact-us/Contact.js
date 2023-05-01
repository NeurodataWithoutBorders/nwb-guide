

import { html } from 'lit';
import { contact_lottie } from '../../../../assets/lotties/contact-us-lotties.js';
import { Page } from '../Page.js';

import { startLottie } from '../../../globals.js'


export class ContactPage extends Page {

  constructor(...args) {
    super(...args)
  }



  updated(){
    let contact_lottie_container = (this ?? this.shadowRoot).querySelector("#contact-us-lottie");
    startLottie(contact_lottie_container, contact_lottie);
  }

  render() {
    return html`
  <section
    id="contact-us-section"
    class="section js-section u-category-menu"
  >
    <div class="documentation_container">
      <div class="document_container">
        <div class="doc_container">
          <div class="dc_con">
            <h1 class="doc_header">Contact Us</h1>
            <hr class="docu_divide" />
            <div class="document-content">
              <div id="contact-us-lottie" class="documentation-lottie_style"></div>
            </div>
            <div class="docu-content-container">
              <h2 class="document_text">
                If you have any issue or suggestions, please email us at
                <a style="text-decoration: underline" href="mailto:help@fairdataihub.org"
                  >help@fairdataihub.org</a
                >
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
    `;
  }
};

customElements.get('nwbguide-contact-page') || customElements.define('nwbguide-contact-page',  ContactPage);
