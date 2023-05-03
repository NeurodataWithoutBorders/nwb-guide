export const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)


export const header = (headerStr: string) => {
    return headerStr.split('_').filter(str => !!str).map(capitalize).join(' ')
}
