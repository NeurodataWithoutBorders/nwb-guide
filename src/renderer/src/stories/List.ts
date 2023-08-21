import { LitElement, html, css } from 'lit';
import { Button } from './Button'
import { empty } from 'handsontable/helpers/dom';

type ListItemType = {
  key: string,
  label: string,
  value: any,
}

export interface ListProps {
  onChange?: () => void;
  items?: ListItemType[]
  emptyMessage?: string
}

export class List extends LitElement {

  static get styles() {
    return css`

      #empty {
        padding: 20px 10px;
        color: gray;
      }

      li > div {
        display: flex;
        align-items: center;
      }

      li {
        padding-bottom: 10px;
      }

      li:last-child {
        padding-bottom: 0px;
      }

      li > div > div {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis
      }

      :host([keys]) ol {
        list-style-type:none;
      }

      :host([keys]) ol > li > div {
        justify-content: center;
      }
    `;
  }

    static get properties() {
      return {
        items: {
            type: Array,
            reflect: true
          }
      };
    }

    onChange: () => void = () => {}

    object: {[x:string]: any} = {}

    get array() {
      return this.items.map(o => o.value)
    }

    declare items: ListItemType[]

    declare emptyMessage: string

    constructor(props: ListProps = {}) {
      super();

      this.items = props.items ?? []
      this.emptyMessage = props.emptyMessage ?? ''
      if (props.onChange) this.onChange = props.onChange

    }

    attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
      super.attributeChangedCallback(name, _old, value)
      if (name === 'items') this.onChange()
    }

    add = (item: ListItemType) => {
      this.items = [...this.items, item]
    }

    #renderListItem = (item: ListItemType, i: number) => {
      const { key, value, label = value } = item;
      const li = document.createElement("li");
      const div = document.createElement('div')
      li.append(div)

      const innerDiv = document.createElement('div')
      div.append(innerDiv)

      const keyEl = document.createElement("span");

      let resolvedKey = key;
      const originalValue = resolvedKey;

      if (key) {

        this.setAttribute('keys', '')

        // Ensure no duplicate keys
        let i = 0;
        while (resolvedKey in this.object) {
            i++;
            resolvedKey = `${originalValue}_${i}`;
        }

        keyEl.innerText = resolvedKey;
        keyEl.contentEditable = true;
        keyEl.style.cursor = "text";
        innerDiv.appendChild(keyEl);

        const sepEl = document.createElement("span");
        sepEl.innerHTML = "&nbsp;-&nbsp;";
        innerDiv.appendChild(sepEl);

        this.object[resolvedKey] = value;
      } else this.object[i] = value;

      const valueEl = document.createElement("span");
      valueEl.innerText = label;
      innerDiv.appendChild(valueEl);

      const button = new Button({
          label: "Delete",
          size: "small",
      });

      button.style.marginLeft = "1rem";

      div.appendChild(button);

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

      innerDiv.title = innerDiv.innerText

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

      this.removeAttribute('keys')
      this.object = {}

      const { items, emptyMessage} = this

      return items.length || !emptyMessage ? html`
      <ol>
        ${items.map(this.#renderListItem)}
      </ol>` : html`<div id="empty">${emptyMessage}</div>`
    }
  }

  customElements.get('nwb-list') || customElements.define('nwb-list',  List);
