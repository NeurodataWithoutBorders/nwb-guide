import { serverGlobals, resolve } from '../src/renderer/src/server/globals'

import { header } from '../src/renderer/src/stories/forms/utils'

import baseMetadataSchema from './json/base_metadata_schema.json' assert { type: "json" }

function getSpeciesNameComponents(arr: any[]) {
    const split = arr[arr.length - 1].split(' - ')
    return {
        name: split[0],
        label: split[1]
    }
}


function getSpeciesInfo(species: any[][] = []) {
    

    return {

        enumLabels: species.reduce((acc, arr) => {
            acc[getSpeciesNameComponents(arr).name] = arr[arr.length - 1]
            return acc
        }, {}),

        enumKeywords: species.reduce((acc, arr) => {
            const info = getSpeciesNameComponents(arr)
            acc[info.name] = info.label ? [`${header(info.label)} — ${arr[0].join(', ')}`] : arr[0]
            return acc
        }, {}),

        enum: species.map(arr => getSpeciesNameComponents(arr).name), // Remove common names so this passes the validator
    }    

}

export const preprocessMetadataSchema = (schema: any = baseMetadataSchema) => {

    // Add unit to weight
    const subjectProps = schema.properties.Subject.properties
    subjectProps.weight.unit = 'kg'

    // subjectProps.order = ['weight', 'age', 'age__reference', 'date_of_birth', 'genotype', 'strain']

    subjectProps.sex.enumLabels = {
        M: 'Male',
        F: 'Female',
        U: 'Unknown',
        O: 'Other'
    }

    
      subjectProps.species = {
        type: 'string',
        ...getSpeciesInfo(),
        items: {
            type: 'string'
        },
        strict: false,
        description: 'The species of your subject.'
    }

    // Resolve species suggestions
    resolve(serverGlobals.species, (res) => {
        const info = getSpeciesInfo(res)
        Object.assign(subjectProps.species, info)
    })

    // Ensure experimenter schema has custom structure
    schema.properties.NWBFile.properties.experimenter = baseMetadataSchema.properties.NWBFile.properties.experimenter

    // Override description of keywords
    schema.properties.NWBFile.properties.keywords.description = 'Terms to describe your dataset (e.g. Neural circuits, V1, etc.)' // Add description to keywords
    return schema

}


export const instanceSpecificFields = {
    Subject: ["weight", "subject_id", "age", "date_of_birth", "age__reference"],
    NWBFile: [
        "session_id",
        "session_start_time",
        "identifier",
        "data_collection",
        "notes",
        "pharmacolocy",
        "session_description",
        "slices",
        "source_script",
        "source_script_file_name",
    ],
};


const globalSchema = structuredClone(preprocessMetadataSchema());
Object.entries(globalSchema.properties).forEach(([globalProp, schema]) => {
    instanceSpecificFields[globalProp]?.forEach((prop) =>  delete schema.properties[prop]);
});

export {
    globalSchema
}

export default preprocessMetadataSchema()
