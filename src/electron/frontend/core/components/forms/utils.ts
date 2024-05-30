import { merge } from '../pages/utils'

const toCapitalizeAll = ['nwb', 'api', 'id']
const toCapitalizeNone = ['or', 'and']


export const createRandomString = () => Math.random().toString(36).substring(7);
export const tempPropertyKey = createRandomString();
export const tempPropertyValueKey = createRandomString();

export const capitalize = (str: string) => {
    const lowerCase = str.toLowerCase()
    return toCapitalizeAll.includes(lowerCase) ? str.toUpperCase() : (toCapitalizeNone.includes(lowerCase) ? lowerCase : str[0].toUpperCase() + str.slice(1))
}


export const header = (headerStr: string) => headerStr.split(/[_\s]/).filter(str => !!str).map(capitalize).join(' ')

export const textToArray = (value: string) => value.split("\n")
                                            .map((str) => str.trim())
                                            .filter((str) => str) // Only keep strings that are not empty


    export const replaceRefsWithValue = (
        schema: any,
        path: string[] = [],
        parent: { [x:string]: any } = structuredClone(schema)
    ) => {

        if (schema && typeof schema === "object" && !Array.isArray(schema)) {

            const copy = { ...schema };

            for (let propName in copy) {
                const prop = copy[propName];
                if (prop && typeof prop === "object" && !Array.isArray(prop)) {
                    const internalCopy = (copy[propName] = { ...prop });
                    const refValue = internalCopy["$ref"]
                    const allOfValue = internalCopy['allOf']
                    if (allOfValue) {
                        copy [propName]= allOfValue.reduce((acc, curr) => {
                            const result = replaceRefsWithValue({ _temp: curr}, path, parent)
                            const resolved = result._temp
                            return merge(resolved, acc)
                        }, {})
                    }
                    else if (refValue) {

                        const refPath = refValue.split('/').slice(1) // NOTE: Assume from base
                        const resolved = refPath.reduce((acc, key) => acc[key], parent)

                        if (resolved) copy[propName] = resolved;
                        else delete copy[propName]
                    } else {
                        for (let key in internalCopy) {
                            const fullPath = [...path, propName, key];
                            internalCopy[key] = replaceRefsWithValue(internalCopy[key], fullPath, parent);
                        }
                    }
                }
            }

            return copy as { [x:string]: any }
        }

        return schema;
    }
