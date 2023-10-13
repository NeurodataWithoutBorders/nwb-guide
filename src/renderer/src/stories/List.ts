import { LitElement, html, css } from 'lit';
import { Button } from './Button'
import { styleMap } from "lit/directives/style-map.js";

type ListItemType = {
  key: string,
  content: string,
  value: any,
}

export interface ListProps {
  onChange?: () => void;
  items?: ListItemType[]
  emptyMessage?: string,
  editable?: boolean,
  unordered?: boolean,
  listStyles?: any
}

export class List extends LitElement {

  static get styles() {
    return css`

      :host {
        overflow: auto;
      }

      #empty {
        padding: 20px 10px;
        color: gray;
      }

      li {
        padding-bottom: 10px;
      }

      li:last-child {
        padding-bottom: 0px;
      }

      li > div {
        display: flex;
        align-items: center;
      }

      li > div > div {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis
      }

      :host([unordered]) ol {
        list-style-type: none;
        display: flex;
        flex-wrap: wrap;
        margin: 0;
        padding: 0;
      }

      :host([unordered]) ol > li {
        width: 100%;
      }

      :host([unordered]) ol > li {
        justify-content: center;
        display: flex;
        align-items: center;
      }

    `;
  }

    static get properties() {
      return {
        items: {
            type: Array,
            // reflect: true // NOTE: Cannot reflect items since they could include an element
        },

        editable: {
          type: Boolean,
          reflect: true
        },

        unordered: {
          type: Boolean,
          // reflect: true
        },
        emptyMessage: {
          type: String,
          reflect: true
        }
      };
    }

    onChange: () => void = () => {}

    object: {[x:string]: any} = {}

    get array() {
      return this.items.map(o => o.value)
    }

    #items: ListItemType[] = []
    set items(value) {
      const oldVal = this.#items
      this.#items = value
      this.onChange()
      this.requestUpdate('items', oldVal)
    }

    get items() { return this.#items }


    declare emptyMessage: string

    declare editable: boolean
    declare unordered: boolean

    declare listStyles: any


    constructor(props: ListProps = {}) {
      super();

      this.items = props.items ?? []
      this.emptyMessage = props.emptyMessage ?? ''
      this.editable = props.editable ?? true
      this.unordered = props.unordered ?? false
      this.listStyles = props.listStyles ?? {}

      if (props.onChange) this.onChange = props.onChange

    }

    add = (item: ListItemType) => {
      this.items = [...this.items, item]
    }

    #renderListItem = (item: ListItemType, i: number) => {
      const { key, value, content = value } = item;
      const li = document.createElement("li");

      const outerDiv = document.createElement('div')
      const div = document.createElement('div')
      li.append(outerDiv)
      outerDiv.append(div)

      const keyEl = document.createElement("span");

      let resolvedKey = key;
      const originalValue = resolvedKey;

      if (key) {

        this.setAttribute('unordered', '')

        // Ensure no duplicate keys
        let i = 0;
        while (resolvedKey in this.object) {
            i++;
            resolvedKey = `${originalValue}_${i}`;
        }

        keyEl.innerText = resolvedKey;
        keyEl.contentEditable = true;
        keyEl.style.cursor = "text";

        const sepEl = document.createElement("span");
        sepEl.innerHTML = "&nbsp;-&nbsp;";
        div.append(keyEl, sepEl);

        this.object[resolvedKey] = value;
      } else this.object[i] = value;

      if (typeof content === 'string')  {
        const valueEl = document.createElement("span");
          valueEl.innerText = content;
          div.appendChild(valueEl);
      }
      else li.append(content)



      if (div.innerText) li.title = div.innerText


      if (this.editable) {
        const button = new Button({
            label: "Delete",
            size: "small",
        });

        button.style.marginLeft = "1rem";

        outerDiv.appendChild(button);

        // Stop enter key from creating new line
        keyEl.addEventListener("keydown", function (e) {
            if (e.keyCode === 13) {
                keyEl.blur();
                return false;
            }
        });

        const deleteListItem = () => this.delete(i);

        keyEl.addEventListener("blur", () => {
            const newKey = keyEl.innerText;
            if (newKey === "") keyEl.innerText = resolvedKey; // Reset to original value
            else {
                delete this.object[resolvedKey];
                resolvedKey = newKey;
                this.object[resolvedKey] = value;
            }
        });

        button.onClick = deleteListItem;
      }

      return li
  };

    delete = (i: number) => {
      this.items.splice(i, 1)
      this.items = [...this.items]
    }

    clear = () => {
      this.items = []
    }

    render() {

      this.removeAttribute('unordered')
      if (this.unordered) this.setAttribute('unordered', '')

      this.object = {}

      const { items, emptyMessage} = this

      return html`
      <ol style=${styleMap(this.listStyles)}>
        ${(items.length || !emptyMessage) ? items.map(this.#renderListItem) : html`<div id="empty">${emptyMessage}</div>`}
      </ol>`
    }
  }

  customElements.get('nwb-list') || customElements.define('nwb-list',  List);
