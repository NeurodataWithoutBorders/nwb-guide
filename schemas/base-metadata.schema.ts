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

export const preprocessMetadataSchema = (schema: any = baseMetadataSchema, global = false) => {


    const copy = structuredClone(schema)

    copy.additionalProperties = false

    // Add unit to weight
    const subjectProps = copy.properties.Subject.properties
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
        strict: false,
        description: 'The species of your subject.'
    }

    // Resolve species suggestions
    resolve(serverGlobals.species, (res) => {
        const info = getSpeciesInfo(res)
        Object.assign(subjectProps.species, info)
    })

    // Ensure experimenter schema has custom structure
    copy.properties.NWBFile.properties.experimenter = baseMetadataSchema.properties.NWBFile.properties.experimenter

    // Override description of keywords
    copy.properties.NWBFile.properties.keywords.description = 'Terms to describe your dataset (e.g. Neural circuits, V1, etc.)' // Add description to keywords


    const ophys = copy.properties.Ophys

    if (ophys) {

        const getProp = (name: string, base = true) => base ? ophys.properties[name] : ophys.properties.definitions?.[name]

        if (getProp("TwoPhotonSeries")) getProp("TwoPhotonSeries").items.order = [
            "name",
            "description",
            "scan_line_rate",
            "field_of_view"
        ]


        if (getProp("ImagingPlane")) getProp("ImagingPlane").items.order = [
            "name",
            "description",
            "device",
            "optical_channel"
        ]
    }


    Object.entries(copy.properties).forEach(([key, value]) => {

        const defs = value.properties.definitions ?? {}

        Object.entries(value.properties).forEach(([k, v]) => {

            if (k ==='definitions') return

            //  Uniformly grab definitions
           const ref = defs[k] ?? v.items ?? v
           if (!ref.properties) return
           Object.keys(ref.properties).forEach(k => {
                const info = ref.properties[k]
                if (info.description && info.description.includes('DEPRECATED')) delete ref.properties[k] // Remove deprecated properties
            })
        })
    })

    // Remove non-global properties
    if (global) {
        Object.entries(copy.properties).forEach(([globalProp, schema]) => {
            instanceSpecificFields[globalProp]?.forEach((prop) =>  delete schema.properties[prop]);
        });
    }

    return copy

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


export const globalSchema = preprocessMetadataSchema(undefined, true);


export default preprocessMetadataSchema()
