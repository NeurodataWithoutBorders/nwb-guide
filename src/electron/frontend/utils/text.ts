const toCapitalizeAll = ['nwb', 'api', 'id']
const toCapitalizeNone = ['or', 'and']

export const capitalize = (str: string) => {
    const lowerCase = str.toLowerCase()
    return toCapitalizeAll.includes(lowerCase) ? str.toUpperCase() : (toCapitalizeNone.includes(lowerCase) ? lowerCase : str[0].toUpperCase() + str.slice(1))
}


export const header = (headerStr: string) => headerStr.split(/[_\s]/).filter(str => !!str).map(capitalize).join(' ')
