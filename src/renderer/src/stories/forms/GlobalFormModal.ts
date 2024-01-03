import { Modal } from "../Modal"
import { Page } from "../pages/Page.js"
import { Button } from "../Button"
import { JSONSchemaForm } from "../JSONSchemaForm"

import { onThrow } from "../../errors";
import { merge } from "../pages/utils.js";
import { save } from "../../progress/index.js";

type BaseFormModalOptions = {
    header: string
    schema: any
    propsToRemove?: string[]
    formProps: {
        validateOnChange?: Function,
        [key: string]: any
    },
    hasInstances?: boolean
}


export function createFormModal ({
    onSave,
    header,
    schema,
    propsToRemove = [],
    formProps,
    hasInstances = false
}: BaseFormModalOptions & { onSave: Function }) {
    const modal = new Modal({
        header
    })

    const content = document.createElement("div")

    const schemaCopy = structuredClone(schema) // Ensure no mutation

    function removeProperties(obj: any, props: string[]) {
        props.forEach(prop =>  delete obj[prop])
    }

    if (hasInstances) Object.keys(schemaCopy.properties).forEach(i => removeProperties(schemaCopy.properties[i].properties, propsToRemove))
    else removeProperties(schemaCopy.properties, propsToRemove)

    const globalForm = new JSONSchemaForm({
        validateEmptyValues: false,
        schema: schemaCopy,
        emptyMessage: "No properties to edit globally.",
        onThrow,
        ...formProps
    })

    content.append(globalForm)

    content.style.padding = "25px"

    const saveButton = new Button({
        label: "Update",
        primary: true,
        onClick: async () => {
            await globalForm.validate()
            const res = await onSave(globalForm)
            if (res !== null) modal.open = false // Allow for aborting
        }
    })

    modal.form = globalForm

    modal.footer = saveButton

    modal.append(content)
    return modal
}

export function createGlobalFormModal(this: Page, {
    header,
    schema,
    propsToRemove = [],
    formProps,

    // Global-specific options
    key,
    hasInstances = false,
    mergeFunction = merge
}: BaseFormModalOptions & {
    key?: string,
    mergeFunction?: Function
}) {

    return createFormModal({
        header,
        schema,
        propsToRemove,
        formProps,
        hasInstances,
        onSave: async ( form ) => {

            const cached: any = {}

            const toPass = { project: key ?  {[key]: form.results} : form.results}

            const forms = (hasInstances ? this.forms :  this.form ? [ { form: this.form }] : []) ?? []
            const tables = (hasInstances ? this.tables : this.table ? [ this.table ] : []) ?? []

            const mergeOpts = {
                // remove: false
            }

            forms.forEach(formInfo => {
                const { subject, form } = formInfo
                const result = cached[subject] ?? (cached[subject] = mergeFunction.call(formInfo, toPass, this.info.globalState, mergeOpts))
                form.globals = structuredClone(key ?  result.project[key]: result)
            })


            tables.forEach(table => {
                const subject = null
                const result = cached[subject] ?? (cached[subject] = mergeFunction(toPass, this.info.globalState, mergeOpts))
                table.globals = structuredClone( key ?  result.project[key]: result)
            })

            await save(this) // Save after all updates are made
        }
    })
}
