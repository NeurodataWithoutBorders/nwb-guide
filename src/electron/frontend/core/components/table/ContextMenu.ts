import { LitElement, css, html } from "lit";


export class ContextMenu extends LitElement{

    static get styles() {
        return css`

        :host {
            display: none;
            position: absolute;
            z-index: 100;
            pointer-events: none;
          }

          ul {
            list-style: none;
          }

          .menu {
            display: flex;
            flex-direction: column;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 10px 20px rgb(64 64 64 / 5%);
            padding: 10px 0;
            pointer-events: all;
          }

          .menu > li > a {
            font: inherit;
            border: 0;
            padding: 10px 30px 10px 15px;
            display: flex;
            align-items: center;
            position: relative;
            text-decoration: unset;
            color: #000;
            font-weight: 500;
            transition: 0.5s linear;
            -webkit-transition: 0.5s linear;
            -moz-transition: 0.5s linear;
            -ms-transition: 0.5s linear;
            -o-transition: 0.5s linear;
          }

          .menu > li > a:hover {
            background:#f1f3f7;
            color: #4b00ff;
          }

          .menu > li > a > i {
            padding-right: 10px;
          }

          .menu > li.trash > a:hover {
            color: red;
          }

          .menu > li[disabled]{
            pointer-events: none;
            opacity: 0.5;
          }
        `
    }

    declare target: Document | HTMLElement
    declare items: any[]
    declare onOpen: () => boolean | void

    constructor({ target, items, onOpen }: any){
        super()

        this.target = target ?? document
        this.items = items ?? []
        this.onOpen = onOpen ?? (() => {})

        document.addEventListener('click', () => this.#hide()) // Hide at the last step of any click
        document.addEventListener('contextmenu', () => this.#hide())
        this.target.addEventListener('contextmenu', (contextEvent) => this.#open(contextEvent))
    }

    #hide() {
        this.#activePath = null
        this.style.display = ""
    }

    #activePath: HTMLElement[] | null = null

    #open(mouseEvent: MouseEvent) {
        mouseEvent.preventDefault()
        mouseEvent.stopPropagation()

        this.#activePath = mouseEvent.path || mouseEvent.composedPath()

        const result = this.onOpen(this.#activePath)
        if (result === false) return

        this.style.display = 'block';
        this.style.left = mouseEvent.pageX + "px";
        this.style.top = mouseEvent.pageY + "px";
    }

    render () {
        return html`
        <ul class="menu">
            ${this.items.map(({ id, onclick , icon, label }) => html`<li class="share" id="${id}" @click=${() => {
                if (onclick) onclick(this.#activePath)
            }}><a href="#">${icon ?? ''}${label}</a></li>`)}
        </ul>
        `
    }
}

customElements.get("nwb-context-menu") || customElements.define("nwb-context-menu", ContextMenu);
