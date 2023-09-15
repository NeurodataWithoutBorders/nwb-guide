const toCapitalizeAll = ['nwb', 'api', 'id']

export const capitalize = (str: string) => toCapitalizeAll.includes(str.toLowerCase()) ? str.toUpperCase() : str[0].toUpperCase() + str.slice(1)


export const header = (headerStr: string) => {
    return headerStr.split('_').filter(str => !!str).map(capitalize).join(' ')
}

export const textToArray = (value: string) => value.split("\n")
                                            .map((str) => str.trim())
                                            .filter((str) => str) // Only keep strings that are not empty
