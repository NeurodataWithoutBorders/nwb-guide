const toCapitalizeAll = ['nwb', 'api', 'id']
const toCapitalizeNone = ['or', 'and']

export const capitalize = (str: string) => {
    const lowerCase = str.toLowerCase()
    return toCapitalizeAll.includes(lowerCase) ? str.toUpperCase() : (toCapitalizeNone.includes(lowerCase) ? lowerCase : str[0].toUpperCase() + str.slice(1))
}


export const header = (headerStr: string) => headerStr.split(/[_\s]/).filter(str => !!str).map(capitalize).join(' ')

export const textToArray = (value: string) => value.split("\n")
                                            .map((str) => str.trim())
                                            .filter((str) => str) // Only keep strings that are not empty


    export const replaceRefsWithValue = (schema: { [x:string]: any }, path = [], parent: { [x:string]: any }) => {
        const copy = { ...schema };

        if (schema && typeof schema === "object" && !Array.isArray(schema)) {
            for (let propName in copy) {
                const prop = copy[propName];
                if (prop && typeof prop === "object" && !Array.isArray(prop)) {
                    const internalCopy = (copy[propName] = { ...prop });
                    if (internalCopy["$ref"]) {
                        const prevItem = path.slice(-1)[0];
                        const resolved = parent.properties.definitions?.[prevItem];
                        copy[propName] = resolved;
                    } else {
                        for (let key in internalCopy) {
                            const fullPath = [...path, propName, key];
                            internalCopy[key] = replaceRefsWithValue(internalCopy[key], fullPath, copy);
                        }
                    }
                }
            }
        } else return schema;

        return copy;
    }