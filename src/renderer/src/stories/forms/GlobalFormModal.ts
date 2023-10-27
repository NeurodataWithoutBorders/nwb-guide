import { Modal } from "../Modal"
import { Page } from "../pages/Page.js"
import { Button } from "../Button"
import { JSONSchemaForm } from "../JSONSchemaForm"

import { onThrow } from "../../errors";
import { merge } from "../pages/utils.js";

export function createGlobalFormModal(this: Page, {
    header,
    schema,
    propsToIgnore = [],
    propsToRemove = [],
    key
}: {
    header: string
    schema: any
    propsToIgnore?: string[]
    propsToRemove?: string[]
    key?: string

}) {
    const modal = new Modal({
        header
    })

    const content = document.createElement("div")

    const schemaCopy = structuredClone(schema)

    Object.keys(schemaCopy.properties).forEach(i => {
        const iSchemaProps = schemaCopy.properties[i].properties
        Object.keys(iSchemaProps).forEach(key => {
            if (propsToRemove.includes(key)) delete iSchemaProps[key]
        })
    })

    const form = new JSONSchemaForm({
        requirementMode: "loose",
        schema: schemaCopy,
        emptyMessage: "No properties to edit globally.",
        ignore: propsToIgnore,
        onUpdate: () => (this.unsavedUpdates = true),
        onThrow,
    })

    content.append(form)

    content.style.padding = "0px 25px 25px 25px"

    const saveButton = new Button({
        label: "Save",
        primary: true,
        onClick: async () => {
            await form.validate()
            const result = merge(key ?  {[key]: form.results} : form.results, this.info.globalState.project)
            await this.save()
            this.forms.forEach(({form}) => {
                console.log(result)
                form.globals = structuredClone(key ?  result[key]: result)
            })
            modal.open = false
        }
    })

    modal.form = form

    modal.footer = saveButton

    modal.append(content)
    return modal
}