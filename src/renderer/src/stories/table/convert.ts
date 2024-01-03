export const renderValue = (value: any, schema: any) => {
    if (schema.type === 'number' || schema.type === 'integer') {
        if (value === null) return ''
    }

    return value ?? ''
}

export const getValue = (value: any, schema: any) => {
    if (schema.type === 'number' || schema.type === 'integer') {

        if (typeof value === 'number') return value

        const og = value
        if (og === '') return undefined
        else {
            if (og === 'NaN') return 'NaN'
            const possibleValue = Number(og)
            if (!isNaN(possibleValue)) return possibleValue
        }

        console.log('Returning', value)


    }

    return value
}
