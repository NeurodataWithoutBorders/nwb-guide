import nwbBaseSchema  from './base-metadata.schema'

const removeSubset = (data, subset) => {
    const subsetData = subset.reduce((acc, key) => { acc[key] = data[key]; return acc }, {})
    for (let key in subsetData) delete data[key]
    return subsetData
  }

  const species = [
    "Mus musculus - House mouse",
    "Homo sapiens - Human",
    "Rattus norvegicus - Norway rat",
    "Rattus rattus - Black rat",
    "Macaca mulatta - Rhesus monkey",
    "Callithrix jacchus - Common marmoset",
    "Drosophila melanogaster - Fruit fly",
    "Danio rerio - Zebra fish",
    "Caenorhabditis elegans"
  ].map(str => str.split(' - ')[0]) // Remove common names so this passes the validator

nwbBaseSchema.properties.Subject.properties.species = {
    type: 'string',
    enum: species,
    items: {
        type: 'string'
    },
    strict: false,
    description: 'The species of your subject.'
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
        items: { type: 'string' }
      },
      ...required,
      ...group,
      ...standardOrder,
    },
    required: newRequiredArray
  }
