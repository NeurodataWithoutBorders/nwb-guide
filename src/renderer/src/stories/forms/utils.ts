export const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)


export const header = (headerStr: string) => {
    return headerStr.split('_').filter(str => !!str).map(capitalize).join(' ')
}

export const textToArray = (value: string) => value.split("\n")
                                            .map((str) => str.trim())
                                            .filter((str) => str) // Only keep strings that are not empty


export const getTableFromForm = (form: any, path: string[]) => {

    const accordion = form.shadowRoot.getElementById(path[0])
    if (!accordion) return

    const nestedForm = accordion.shadowRoot.querySelector('nwb-jsonschema-form')
    if (!nestedForm) return

    const container = nestedForm.shadowRoot.getElementById(path.join('-')) // Encapsulating container
    if (!container) return

    return container.children[1] // Nested table element
}
