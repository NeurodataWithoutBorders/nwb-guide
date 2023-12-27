

export const getValue = (value: any, schema: any) => {
    if (schema.type === 'number' || schema.type === 'integer') {

        if (typeof value === 'number') return value

        const og = value
        if (og === '') return undefined
        else {
            if (og === 'NaN' || og === 'None' || og === 'null') return null
            const possibleValue = Number(og)
            if (!isNaN(possibleValue)) return possibleValue
        }

    }

    return value
}
