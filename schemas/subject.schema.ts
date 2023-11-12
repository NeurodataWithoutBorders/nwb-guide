import nwbBaseSchema from './base-metadata.schema'

const removeSubset = (data, subset) => {
    const subsetData = subset.reduce((acc, key) => { acc[key] = data[key]; return acc }, {})
    for (let key in subsetData) delete data[key]
    return subsetData
  }

// Sort the subject schema
const ageGroupKeys = ['age', 'age__reference', 'date_of_birth']
const genotypeGroupKeys = ['genotype', 'strain']
const groups = [...ageGroupKeys, ...genotypeGroupKeys]
const standardOrder = {...nwbBaseSchema.properties.Subject.properties}
const group = removeSubset(standardOrder, groups)
const required = removeSubset(standardOrder, nwbBaseSchema.properties.Subject.required)

let newRequiredArray = [...nwbBaseSchema.properties.Subject.required, 'sessions']

export default {
    ...nwbBaseSchema.properties.Subject,
    properties: {
      sessions: {
        type: 'array',
        uniqueItems: true,
        description: 'A comma-separated list of valid session_id values.',
        items: { type: 'string' }
      },
      ...required,
      ...group,
      ...standardOrder,
    },
    required: newRequiredArray
  }
