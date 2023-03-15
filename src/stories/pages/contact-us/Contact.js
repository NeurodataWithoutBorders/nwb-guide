

import { html } from 'lit';
import lottie from 'lottie-web';
import { contact_lottie } from '../../../../assets/lotties/contact-us-lotties.js';
import { Page } from '../Page.js';

export class ContactPage extends Page {

  constructor () {
    super()
  }



  updated(){
    let contact_lottie_container = (this ?? this.shadowRoot).querySelector("#contact-us-lottie");

    lottie.loadAnimation({
      container: contact_lottie_container,
      animationData: contact_lottie /*(json js variable, (view src/assets/lotties)*/,
      renderer: "svg",
      loop: true /*controls looping*/,
      autoplay: true,
    });
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

{/*
<br />
If you are reaching us regarding an issue, we suggest that you attach the SODA
and Pennsieve log files to the email. Just click on the button below to save those
logs file at your desired location.
<div class="button_container_contact">
<button
  id="gather-logs-button"
  class="view_doc_button sodaVideo-button"
  onclick="gatherLogs()"
  style="margin-top: 1rem"
>
  Gather Logs
</button>
</div> */}

customElements.get('nwbguide-contact-page') || customElements.define('nwbguide-contact-page',  ContactPage);
