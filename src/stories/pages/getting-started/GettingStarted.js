

import { html } from 'lit';
import lottie from 'lottie-web';
import { column1Lottie, column2Lottie, column3Lottie, heartLottie } from '../../../../assets/lotties/overview-lotties.js';
import { openLink } from '../../../links.js';
import { Page } from '../Page.js';

export class GettingStartedPage extends Page {

  constructor () {
    super()
  }

  updated(){
    // this.content = (this.shadowRoot ?? this).querySelector("#content");

    // Here is where the splash screen lotties are created and loaded.
    // A mutation observer watches for when the overview tab element has
    // a class change to 'is-shown' to know when to load and unload the lotties
    let over_view_section =  this.query("#getting_started-section");
    let column1 = this.query("#lottie1");
    let column2 = this.query("#lottie2");
    let column3 = this.query("#lottie3");
    let heart_lottie = this.query("#heart_lottie");

    var column1_lottie = lottie.loadAnimation({
      container: column1,
      animationData: column1Lottie /*(json js variable, (view src/assets/lotties)*/,
      renderer: "svg",
      loop: true /*controls looping*/,
      autoplay: true,
    });
    var column2_lottie = lottie.loadAnimation({
      container: column2,
      animationData: column2Lottie /*(json js variable, (view src/assets/lotties)*/,
      renderer: "svg",
      loop: true /*controls looping*/,
      autoplay: true,
    });
    var column3_lottie = lottie.loadAnimation({
      container: column3,
      animationData: column3Lottie,
      renderer: "svg",
      loop: true,
      autoplay: true,
    });
    var heart_container = lottie.loadAnimation({
      container: heart_lottie,
      animationData: heartLottie,
      renderer: "svg",
      loop: true,
      autoplay: true,
    });

    var overview_observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        var attributeValue = $(mutation.target).prop(mutation.attributeName);

        if (attributeValue.includes("is-shown") == true) {
          //add lotties
          column1_lottie.play();
          column2_lottie.play();
          column3_lottie.play();
          heart_container.play();
        } else {
          column1_lottie.stop();
          column2_lottie.stop();
          column3_lottie.stop();
          heart_container.stop();
        }
      });
    });

    overview_observer.observe(over_view_section, {
      attributes: true,
      attributeFilter: ["class"],
    });


  }

  render() {
    return html`
    <section
    id="getting_started-section"
    class="getting-started-overview section js-section u-category-windows is-shown fullShown"
  >
    <div class="getting-started-header lg:mt-8">
      <div class="front-page_logo">
        <img
          id="frontpage-logo"
          src="assets/img/logo-neuroconv.png"
          width="120px"
          height="100px"
          class="neuroconv-welcome"
        />
      </div>
      <p class="header-text">
        Your one-stop tool for converting and uploading NWB datasets to the DANDI Archive!<br />
      </p>
    </div>

    <div class="overview-card-layout grid h-auto w-full grid-cols-3 gap-6">
      <div id="overview-column-1" class="overview-column">
        <p class="overview_lottie_header">Curate</p>

        <div id="lottie1" class="overview-lottie"></div>
        <p style="margin: 0">
          Rapidly prepare your data and metadata according to the NWB Best Practices and DANDI
          requirements
        </p>
      </div>
      <div id="overview-column-2" class="overview-column">
        <p class="overview_lottie_header">Share</p>
        <div id="lottie2" class="overview-lottie"></div>
        <p style="margin: 0">Easily upload your curated dataset to the DANDI archive</p>
      </div>
      <div id="overview-column-3" class="overview-column">
        <p class="overview_lottie_header">Relax</p>
        <div id="lottie3" class="overview-lottie" style="width: 116"></div>
        <p style="margin: 0">
          The NWB Assistant comes with intuitive user interfaces and automation that streamline the
          process for you
        </p>
      </div>
    </div>
    <div class="getting-started-buttons grid h-auto w-full grid-cols-3 gap-6">
      <button
        id="home-button-interface-instructions-link"
        class="getting-started-btn secondary-plain-button text-base"
        @click="${() => openLink("https://docs.sodaforsparc.io/docs/getting-started/user-interface")}"
      >
        <p class="interface-btn-txt">Learn about NWB and DANDI</p>

        <i class="fas fa-play"></i>
      </button>

      <button
        id="home-button-guided-mode-link"
        class="getting-started-btn secondary-plain-button text-base"
        @click="${() => this.onTransition('Guided Mode')}"
      >
        <p class="getting-started-btn-txt">Begin curating a new dataset</p>
        <i class="el-icon icon-animate"
          ><svg
            class="icon"
            width="200"
            height="200"
            viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
            style="height: 2.2rem; width: 2.5rem"
          >
            <path
              fill="currentColor"
              d="M452.864 149.312a29.12 29.12 0 0141.728.064L826.24 489.664a32 32 0 010 44.672L494.592 874.624a29.12 29.12 0 01-41.728 0 30.592 30.592 0 010-42.752L764.736 512 452.864 192a30.592 30.592 0 010-42.688zm-256 0a29.12 29.12 0 0141.728.064L570.24 489.664a32 32 0 010 44.672L238.592 874.624a29.12 29.12 0 01-41.728 0 30.592 30.592 0 010-42.752L508.736 512 196.864 192a30.592 30.592 0 010-42.688z"
            ></path>
          </svg>
        </i>
      </button>
      <button
        id="home-button-free-form-mode-link"
        class="getting-started-btn secondary-plain-button text-base"
        disabled
      >
        <p class="getting-started-btn-txt">Continue working on an NWB dataset</p>
        <i class="el-icon icon-animate"
          ><svg
            class="icon"
            width="200"
            height="200"
            viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
            style="height: 2.2rem; width: 2.5rem"
          >
            <path
              fill="currentColor"
              d="M452.864 149.312a29.12 29.12 0 0141.728.064L826.24 489.664a32 32 0 010 44.672L494.592 874.624a29.12 29.12 0 01-41.728 0 30.592 30.592 0 010-42.752L764.736 512 452.864 192a30.592 30.592 0 010-42.688zm-256 0a29.12 29.12 0 0141.728.064L570.24 489.664a32 32 0 010 44.672L238.592 874.624a29.12 29.12 0 01-41.728 0 30.592 30.592 0 010-42.752L508.736 512 196.864 192a30.592 30.592 0 010-42.688z"
            ></path>
          </svg>
        </i>
      </button>
    </div>
    <div style="display: flex; justify-content: center">
      <div
        class="flex w-full items-center justify-center pb-2"
        style="justify-content: center; display: flex; align-items: center"
      ></div>
    </div>
  </section>
    `;
  }
};

customElements.get('nwbguide-start-page') || customElements.define('nwbguide-start-page',  GettingStartedPage);
