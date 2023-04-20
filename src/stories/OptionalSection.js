import { LitElement, css, html } from "lit"
import "./Button"
import { Button } from "./Button"

export class OptionalSection extends LitElement {

    static get styles(){
        return css`
            :host {
                text-align: center;
            }

            .optional-section__content {
                text-align: left;
            }

        `
    }

    static get properties() {
        return {
            state: { type: Boolean, reflect: true },
        }
    }

    get hidden() {
        return this.shadowRoot.querySelector('.optional-section__content').hidden
    }

    constructor(props){
        super()
        this.title = props.title ?? ''
        this.description = props.description ?? 'This is the description of the optional section.'
        this.content = props.content ?? ''
        this.altContent = props.altContent ?? ''
        this.state = props.state
    }

    show(state){
        this.toggled = true
        const content = this.shadowRoot.querySelector('.optional-section__content')
        const altContent = this.shadowRoot.querySelector('#altContent')

        if (state === undefined) state = !content.classList.contains('hidden')

        if (state) {
            content.removeAttribute('hidden')
            altContent.setAttribute('hidden', true)
        } else {
            content.setAttribute('hidden', true)
            altContent.removeAttribute('hidden', '')
        }
    }

    yes = new Button({
        label: 'Yes',
        color: 'green',
        onClick: () => {
            this.show(true)
            this.yes.primary = true
            this.no.primary = false
        }
    })

    no = new Button({
        label: 'No',
        color: 'red',
        onClick: () => {
            this.show(false)
            this.yes.primary = false
            this.no.primary = true
        }
    })

    updated(){
        if (this.state === undefined) return

        if (this.state) this.yes.click()
        else this.no.click()
    }

    render(){

        return html`
            <div class="optional-section">
                <div class="optional-section__header">
                    ${this.title ? html`<h2 class="optional-section__title">${this.title}</h2>` : ''}
                    <p class="optional-section__description">${this.description}</p>
                    <div class="optional-section__toggle">
                        ${this.yes}
                        ${this.no}
                    </div>
                </div>
                <div class="optional-section__content" hidden>
                    <slot>${this.content}</slot>
                </div>
                <div id="altContent" class="optional-section__content" hidden>
                    ${this.altContent}
                </div>
            </div>
        `
    }

}

customElements.get('nwb-optional-section') || customElements.define('nwb-optional-section', OptionalSection);
