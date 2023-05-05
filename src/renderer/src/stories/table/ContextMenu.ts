import { LitElement, css, html } from "lit";


export class ContextMenu extends LitElement{

    static get styles() {
        return css`

        :host {
            display: none;
            position: absolute;
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
        `
    }

    declare target: Document | HTMLElement
    declare items: any[]

    constructor({ target, items }: any){
        super()

        this.target = target ?? document
        this.items = items ?? []

        document.addEventListener('click', () => this.#hide()) // Hide at the last step of any click
        this.target.addEventListener('contextmenu', (e) => this.#rightClick(e))
    }

    #hide() {
        this.style.display = "" 
    }

    #activePath: HTMLElement[] | null = null

    #rightClick(e: MouseEvent) {
        e.preventDefault()
        if (this.style.display == "block") {
            this.#activePath = null
            this.#hide()
        } else {
            this.#activePath = e.path || e.composedPath()
            this.style.display = 'block'; 
            this.style.left = e.pageX + "px"; 
            this.style.top = e.pageY + "px";
        } 
    }

    render () {
        return html`
        <ul class="menu"> 
            ${this.items.map((o) => html`<li class="share" @click=${() => {
                if (o.onclick) o.onclick(this.#activePath)
            }}><a href="#">${o.icon ?? ''}${o.label}</a></li>`)}
        </ul> 
        `
    }
}

customElements.get("nwb-context-menu") || customElements.define("nwb-context-menu", ContextMenu);
