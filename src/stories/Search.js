import { LitElement, html, css } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';


export class Search extends LitElement {
  constructor({ options } = {}) {
    super();
    this.options = options;
  }

  static get styles() {
    return css`

    * {
      box-sizing: border-box;
    }

    :host {
      display: block;
      background: white;
      border-radius: 5px;
      font-family: 'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }

    .header {
      padding: 25px;
    }

    input {
      width: 100%;
      background: #f2f2f2;
      border: 1px solid #d9d9d9; ;
      border-radius: 10px;
      padding: 10px 15px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .hidden {
      display: none;
    }

    .option {
      padding: 25px;
      border-top: 1px solid #f2f2f2;
    }

    .option:hover {
      background: #f2f2f2;
      cursor: pointer;
    }

    .label {
      margin: 0;
    }
`;
  }

  static get properties() {
    return {
      options: { type: Object }
    };
  }

  updated() {
    const options = this.shadowRoot.querySelectorAll('.option')
    this.#options = Array.from(options).map(option => {
      const keywords = JSON.parse(option.getAttribute('data-keywords'))
      return { option, keywords, label: option.querySelector('.label').innerText }
    })
  }

  onSelect = (id, value) => {}

  #onSelect = (id, value) => {
    this.shadowRoot.querySelector('input').value = ''
    this.#options.forEach(({option}) => option.classList.add('hidden')) // Hide all
    this.onSelect(id, value)
  }

  #options = []
  render() {

    return html`
    <div class="header">
      <input placeholder="Type here to search" @input=${(ev) => {

        const input = ev.target.value
        const toShow = []
        // Check if the input value matches the label
        this.#options.forEach(({ option, label }, i) => {
          if (label.toLowerCase().includes(input.toLowerCase()) && !toShow.includes(i)) toShow.push(i)
        })

          // Check if the input value matches any of the keywords
          this.#options.forEach(({ option, keywords }, i) => {
            keywords.forEach(keyword => {
              if (keyword.toLowerCase().includes(input.toLowerCase()) && !toShow.includes(i)) toShow.push(i)
            })
          })

        this.#options.forEach(({ option }, i) => {
          if (toShow.includes(i)) {
            option.classList.remove('hidden')
          } else {
            option.classList.add('hidden')
          }
        })
        
      }}></input>
    </div>
    <ul>
     <slot>
      ${this.options.map(option => html`<li 
      class="option hidden" 
      data-keywords="${JSON.stringify(option.keywords)}"
      @click=${() => this.#onSelect(option.label, option)}
      >
        <h4 class="label">${option.label}</h4>
        <small class="keywords">${option.keywords.join(', ')}</small>
      </li>`)}
     </slot>
    </ul>
    `;
  }

}

customElements.get('nwb-search') || customElements.define('nwb-search',  Search);
