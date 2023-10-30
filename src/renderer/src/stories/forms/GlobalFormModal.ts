import { Modal } from "../Modal"
import { Page } from "../pages/Page.js"
import { Button } from "../Button"
import { JSONSchemaForm } from "../JSONSchemaForm"

import { onThrow } from "../../errors";
import { merge } from "../pages/utils.js";
import { save } from "../../progress/index.js";


export function createGlobalFormModal(this: Page, {
    header,
    schema,
    propsToIgnore = [],
    propsToRemove = [],
    key,
    hasInstances = false,
    validateOnChange
}: {
    header: string
    schema: any
    propsToIgnore?: string[]
    propsToRemove?: string[]
    key?: string,
    hasInstances?: boolean
    validateOnChange?: Function

}) {
    const modal = new Modal({
        header
    })

    const content = document.createElement("div")

    const schemaCopy = structuredClone(schema)

    function removeProperties(obj: any, props: string[]) {
        props.forEach(prop =>  delete obj[prop])
    }

    if (hasInstances) Object.keys(schemaCopy.properties).forEach(i => removeProperties(schemaCopy.properties[i].properties, propsToRemove))
    else removeProperties(schemaCopy.properties, propsToRemove)

    const form = new JSONSchemaForm({
        requirementMode: "loose",
        schema: schemaCopy,
        emptyMessage: "No properties to edit globally.",
        ignore: propsToIgnore,
        onThrow,
        validateOnChange
    })

    content.append(form)

    content.style.padding = "25px"

    const saveButton = new Button({
        label: "Update",
        primary: true,
        onClick: async () => {
            await form.validate()
            const result = merge(key ?  {[key]: form.results} : form.results, this.info.globalState.project)
            await save(this)

            const forms = hasInstances ? this.forms.map(o => o.form) :  this.form ? [ this.form ] : []
            const tables = hasInstances ? this.tables : this.table ? [ this.table ] : []
            forms.forEach(form =>form.globals = structuredClone(key ?  result[key]: result))
            tables.forEach(table => table.globals = structuredClone(key ?  result[key]: result))

            modal.open = false
        }
    })

    modal.form = form

    modal.footer = saveButton

    modal.append(content)
    return modal
}