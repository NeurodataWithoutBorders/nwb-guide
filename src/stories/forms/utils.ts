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