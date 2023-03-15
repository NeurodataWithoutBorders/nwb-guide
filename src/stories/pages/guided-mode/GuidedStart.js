

import { html } from 'lit';
import { Page } from '../Page.js';
import { GuidedFooter } from './footer/GuidedFooter';
import "../../multiselect/MultiSelectForm.js";


export class GuidedStartPage extends Page {

  constructor () {
    super()
  }

  updated(){
    // this.content = (this.shadowRoot ?? this).querySelector("#content");
  }

  render() {

    const footer = new GuidedFooter();

    // back: () => this.onTransition(-1),
    // next: () => this.onTransition(1),
    // exit: true

    const back = document.createElement('button');
    back.innerText = 'Back';
    back.addEventListener('click', () => this.onTransition(-1));

    const next = document.createElement('button');
    next.innerText = 'Next'; // Save and Continue
    next.addEventListener('click', () => this.onTransition(1));

    const exit = document.createElement('button');
    exit.innerText = 'Save and Exit';
    exit.addEventListener('click', () => this.onTransition('/'));

    footer.insertAdjacentElement('beforeend', back)
    footer.insertAdjacentElement('beforeend', next)
    footer.insertAdjacentElement('beforeend', exit)

    return html`
  <section
    class="section js-section u-category-windows"
  >

        <div
          id="guided-mode-starting-container"
          class="guided--main-tab"
          data-parent-tab-name="Dataset Structure"
        >
          <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
            <div class="title-border">
              <h1 class="guided--text-sub-step">Welcome to Guided Mode!</h1>
            </div>
            <div class="guided--section">
              <p class="guided--help-text">
                Guided Mode is designed to be the simplest and most efficient method of curating and
                sharing a SPARC dataset if you are starting from scratch. Guided Mode guides you
                through the entire SPARC curation and sharing process via intuitive user interfaces
                that typically only require you to provide basic inputs or answer simple questions.
              </p>
              <div class="guided--info-dropdown">
                <p class="guided--dropdown-text" data-dropdown-type="info">
                  Learn more about curating and submitting SPARC datasets
                </p>
                <i class="fas fa-chevron-right"></i>
              </div>
              <div class="guided--info-container">
                <p class="guided--help-text">
                  Although not required to use Guided Mode, you can learn more about the SPARC data
                  curation and sharing process in the
                  <a href="https://docs.sparc.science/docs/data-submission-overview" target="_blank"
                    >SPARC Data Submission Overview document page</a
                  >.
                </p>
              </div>
              <p class="guided--help-text" style="margin-top: 1em">
                Guided Moded is divived in four high-level sections. During the first three sections,
                you will be directed to specify the files to include in your dataset and provide
                information about your dataset. On the final section, SODA will automatically generate
                your dataset on Pennsieve with the proper folder structure and metadata files. Note
                that none of your local data files will ever be modified or moved.
              </p>
  
              <h2>Define your Data Formats</h2>
              <nwb-multiselect-form
                id="neuroconv-define-formats"
              ></nwb-multiselect-form>
            </div>
          </div>
        </div>
        ${footer}
    </section>
    `;
  }
};

customElements.get('nwbguide-guided-start-page') || customElements.define('nwbguide-guided-start-page',  GuidedStartPage);