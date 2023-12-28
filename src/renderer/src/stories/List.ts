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
        margin-left: -40px;
        color: gray;
      }

      :host([unordered]) #empty {
        margin: 0;
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

      :host(:not([unordered])) li {
        cursor: move;
      }


      ol:not(:has(li)) {
        margin-top: 0;
      }


      :host([unordered]) ol {
        list-style-type: none;
        display: flex;
        flex-wrap: wrap;
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

      [contenteditable] {
        cursor: text;
      }

      [data-idx]{
        background: #f0f0f0;
        height: 25px;
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

    allowDrop = (ev) => ev.preventDefault();


    #dragged?: number
    #placeholder = document.createElement('div')

    drag = (ev, i) => this.#dragged = i

    dragEnter = (ev, i) => {
       ev.preventDefault();
        if (this.#dragged !== i) {
          const item = this.shadowRoot.getElementById(`item-${i}`)
          this.#placeholder.setAttribute('data-idx', i)
          item?.insertAdjacentElement('beforebegin',  this.#placeholder)
        } else {
          this.#removePlaceholder()
        }
    }

    dragExit = (ev, i) => {
      ev.preventDefault();
      if (this.#placeholder && i.toString() !== this.#placeholder.getAttribute('data-idx')){
        this.#removePlaceholder()
      }
    }

    drop = (ev, i) => {

      ev.preventDefault();
      const draggedIdx = this.#dragged as number
      this.#dragged = undefined

      const movedItem = this.items[draggedIdx]
      this.items.splice(draggedIdx, 1)
      this.items.splice(i, 0, movedItem)

      this.items = [...this.items]
    }


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

    #removePlaceholder = () => {
      this.#placeholder.removeAttribute('data-idx')
      this.#placeholder.remove()
    }

    #renderListItem = (item: ListItemType, i: number) => {
      const { key, value, content = value } = item;
      const li = document.createElement("li");
      li.id = `item-${i}`;

      if (!this.unordered) {
        li.draggable = true;
        li.ondragstart = (ev) => this.drag(ev, i);

        li.ondragend = (ev) => {
          if (this.#dragged !== undefined) {
            const idx = this.#placeholder.getAttribute('data-idx')
            if (idx !== null) this.drop(ev, parseInt(idx))
            this.#removePlaceholder()
          }
        }

        li.ondrop = (ev) => this.drop(ev, i);

        li.ondragover = (ev) => this.dragEnter(ev, i);
        // li.ondragenter = (ev) => this.dragEnter(ev, i);
        li.ondragleave = (ev) => this.dragExit(ev, i);
      }


      const outerDiv = document.createElement('div')
      const div = document.createElement('div')
      li.append(outerDiv)
      outerDiv.append(div)

      let editableElement = document.createElement("span");

      let resolvedKey = key;
      const originalValue = resolvedKey;

      const isUnordered = !!key

      if (isUnordered) {

        this.setAttribute('unordered', '')

        // Ensure no duplicate keys
        let i = 0;
        while (resolvedKey in this.object) {
            i++;
            resolvedKey = `${originalValue}_${i}`;
        }

        const keyEl = editableElement

        keyEl.innerText = resolvedKey;
        keyEl.style.cursor = "text";

        const sepEl = document.createElement("span");
        sepEl.innerHTML = "&nbsp;-&nbsp;";
        div.append(keyEl, sepEl);

        this.object[resolvedKey] = value;
      }

      else {
        this.object[i] = value;
      }

      if (typeof content === 'string')  {
          const valueEl = document.createElement("span");
          if (!key) editableElement = valueEl
          valueEl.innerText = content;
          div.appendChild(valueEl);
      }
      else li.append(editableElement = content)



      if (div.innerText) li.title = div.innerText


      if (this.editable) {
        const button = new Button({
            label: "Delete",
            size: "small",
        });

        button.style.marginLeft = "1rem";

        outerDiv.appendChild(button);

        editableElement.contentEditable = true;

        // Stop enter key from creating new line
        editableElement.onkeydown = (e) => {
            if (e.keyCode === 13) {
              editableElement.blur();
                return false;
            }
        };

        const deleteListItem = () => this.delete(i);

        editableElement.onblur = () => {
            const newKey = editableElement.innerText;
            if (newKey === "") this.delete(i); // Delete if empty
            else {
                  const oKey = isUnordered ? resolvedKey : i;
                  delete this.object[oKey];
                  this.object[newKey] = value;

                  if (!isUnordered) {
                    this.items[i].value = newKey
                    this.items = [...this.items]
                  }
            }
        };

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
