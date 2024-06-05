import { LitElement, html, css } from 'lit';
import { Button } from './Button'
import { styleMap } from "lit/directives/style-map.js";

type ListItemType = {
  key: string,
  content: string,
  value: any,
  controls: HTMLElement[],
  originalKey?: string
}

export interface ListProps {
  onChange?: () => void;
  items?: ListItemType[]
  emptyMessage?: string,
  editable?: boolean,
  unordered?: boolean,
  listStyles?: any
  transform?: (item: ListItemType) => ListItemType
}

type ListState = {
  items: ListItemType[],
  object: {[x:string]: ListItemType['value']}
}

export class List extends LitElement {

  transform: ListProps['transform']

  static get styles() {
    return css`

      :host {
        overflow: auto;
      }

      ol {
        margin: 0px;
      }


      #empty {
        margin: 1rem;
        margin-left: -40px;
        color: gray;
      }

      :host([unordered]) #empty {
        margin-left: calc(1rem - 40px) !important;
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
        margin: 0px;
      }

      :host([unordered]) ol:has(li) {
        padding: 0px;
      }


      :host([unordered]) ol {
        list-style-type: none;
        display: flex;
        flex-wrap: wrap;
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

      [contenteditable="true"]:hover  {
        background-color: rgba(217, 245, 255, 0.6);
      }

      [data-idx]{
        background: #f0f0f0;
        height: 25px;
      }

      .controls {
        margin-left: 1rem;
        display: flex;
        gap: 0.5rem;
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
          reflect: true
        },
        emptyMessage: {
          type: String,
          reflect: true
        }
      };
    }

    onChange: (updated: ListState, previous: ListState) => void = () => {}

    object: {[x:string]: any} = {}

    get array() {
      return this.items.map(item => item.value)
    }

    #previousItems = []
    #items: ListItemType[] = []

    set items(value: ListItemType[] | any[]) {

      const oldList = this.#previousItems
      const uniform = value.map(item => item && typeof item === 'object' ? item : { value: item })
      this.#items = uniform.map(item => this.transform ? this.transform(item) ?? item : item)
      this.#previousItems = this.#items.map(item => ({...item})) // Clone items
      const oldObject = this.object
      this.#updateObject()

      if (this.#initialized) {

        this.onChange({
          items: this.#items,
          object: this.object
        },
        {
          items: oldList,
          object: oldObject
        })
      }

      this.requestUpdate('items', oldList)
    }

    get items() { return this.#items }


    declare emptyMessage: string

    declare editable: boolean
    declare unordered: boolean

    declare listStyles: any

    #initialized = false

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

      this.items = this.items
    }


    constructor(props: ListProps = {}) {
      super();

      this.items = props.items ?? []
      this.emptyMessage = props.emptyMessage ?? ''
      this.editable = props.editable ?? true
      this.unordered = props.unordered ?? false
      this.listStyles = props.listStyles ?? {}

      this.transform = props.transform

      if (props.onChange) this.onChange = props.onChange

      this.#initialized = true

    }

    add = (item: ListItemType) => {
      this.items.push({ ...item }) // Update original
      this.items = this.items
    }

    #removePlaceholder = () => {
      this.#placeholder.removeAttribute('data-idx')
      this.#placeholder.remove()
    }

    #renderListItem = (item: ListItemType, i: number) => {
      const { key, value, content = value } = item;

      if (!item.originalKey) item.originalKey = key

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

      const controlsDiv = document.createElement('div');
      controlsDiv.classList.add("controls");

      let editableElement = document.createElement("span");

      let resolvedKey = key;
      const originalValue = resolvedKey;

      const isUnordered = !!key

      const isObjectContent = content && typeof content === 'object'

      if (isUnordered) {

        this.setAttribute('unordered', '')

        // Ensure no duplicate keys
        let i = 0;
        while (resolvedKey in this.object) {
            i++;
            resolvedKey = `${originalValue} (${i})`;
        }

        const keyEl = editableElement

        keyEl.innerText = resolvedKey;
        keyEl.style.cursor = "text";
        div.append(keyEl);

        if (!isObjectContent) {
          const sepEl = document.createElement("span");
          sepEl.innerHTML = "&nbsp;-&nbsp;";
          div.append(sepEl);
        }

        this.object[resolvedKey] = value;
      }

      else {
        this.object[i] = value;
      }

      if (content instanceof HTMLElement) li.append(editableElement = content)
      else if (isObjectContent) {} // Skip other object contents

      // Always attempt render of other items
      else {
          const valueEl = document.createElement("span");
          if (!key) editableElement = valueEl
          valueEl.innerText = content;
          div.appendChild(valueEl);
      }



      if (div.innerText) li.title = div.innerText

      if (item.controls || this.editable) outerDiv.append(controlsDiv)

      if (item.controls) controlsDiv.appendChild(...item.controls);

      if (this.editable) {

        const button = new Button({
            label: "Delete",
            size: "small",
        });

        controlsDiv.appendChild(button);

        editableElement.contentEditable = true;

        // Stop enter key from creating new line
        editableElement.onkeydown = (keyDownEvent) => {
            if (keyDownEvent.keyCode === 13) {
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

                  if (isUnordered) {
                    this.items[i].key = newKey
                  } else {
                    this.items[i].value = newKey
                  }
                  this.items = this.items

            }
        };

        button.onClick = deleteListItem;
      }

      return li
  };

    delete = (i: number) => {
      this.items.splice(i, 1)
      this.items = this.items
    }

    clear = () => {
      // Remove items in original list
      for (let i = this.items.length - 1; i >= 0; i--) this.items.splice(i, 1)
      this.items = this.items
    }

    #updateObject = () => {

      this.object = {}
      this.#items.forEach((item, i) => {

        const { key, value } = item;

        const isUnordered = !!key
        if (isUnordered) {
          let resolvedKey = key

          // Ensure no duplicate keys
          let kI = 0;
          while (resolvedKey in this.object) {
              kI++;
              resolvedKey = `${key} (${kI})`;
          }

          this.object[resolvedKey] = value
        }

        else {
          this.object[i] = value
        }
      })
    }

    render() {

      this.object = {}

      const { items, emptyMessage} = this

      return html`
      <ol style=${styleMap(this.listStyles)}>
        ${(items.length || !emptyMessage) ? items.map(this.#renderListItem) : html`<div id="empty">${emptyMessage}</div>`}
      </ol>`
    }
  }

  customElements.get('nwb-list') || customElements.define('nwb-list',  List);
