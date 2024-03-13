import { serverGlobals, resolve } from '../src/renderer/src/server/globals'

import { header, replaceRefsWithValue } from '../src/renderer/src/stories/forms/utils'

import baseMetadataSchema from './json/base_metadata_schema.json' assert { type: "json" }

const uvMathFormat = `&micro;V`; //`<math xmlns="http://www.w3.org/1998/Math/MathML"><mo>&micro;</mo><mi>V</mi></math>`

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

const propsToInclude = {
    ecephys: ["Device", "ElectrodeGroup", "Electrodes", "ElectrodeColumns", "definitions"]
}

export const preprocessMetadataSchema = (schema: any = baseMetadataSchema, global = false) => {


    const copy = replaceRefsWithValue(structuredClone(schema))

    copy.additionalProperties = false



    copy.required = Object.keys(copy.properties) // Require all properties at the top level

    copy.order = [ "NWBFile", "Subject" ]

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

    // copy.order = ['NWBFile', 'Subject']

    copy.properties.NWBFile.title = 'General Metadata'
    const nwbProps = copy.properties.NWBFile.properties
    nwbProps.keywords.items.description = "Provide a single keyword (e.g. Neural circuits, V1, etc.)"

    // Resolve species suggestions
    resolve(serverGlobals.species, (res) => {
        const info = getSpeciesInfo(res)
        Object.assign(subjectProps.species, info)
    })

    // Ensure experimenter schema has custom structure
    nwbProps.experimenter = baseMetadataSchema.properties.NWBFile.properties.experimenter

    // Ensure related_publications schema has custom structure
    nwbProps.related_publications = baseMetadataSchema.properties.NWBFile.properties.related_publications


    // Override description of keywords
    nwbProps.keywords.description = 'Terms to describe your dataset (e.g. Neural circuits, V1, etc.)' // Add description to keywords

    const ecephys = copy.properties.Ecephys
    const ophys = copy.properties.Ophys

    if (ecephys) {

        // Change rendering order for electrode table columns
        const electrodesProp = ecephys.properties["Electrodes"]
        for (let name in electrodesProp.properties) {
            const interfaceProps = electrodesProp.properties[name].properties
            const electrodeItems = interfaceProps["Electrodes"].items.properties
            const uvProperties = ["gain_to_uV", "offset_to_uV"]

            uvProperties.forEach(prop => {
                electrodeItems[prop] = {}
                electrodeItems[prop].title = prop.replace('uV', uvMathFormat)
                console.log(electrodeItems[prop])
            })
            interfaceProps["Electrodes"].items.order = ["channel_name", "group_name", "shank_electrode_number", ...uvProperties];
            interfaceProps["ElectrodeColumns"].items.order = ["name", "description", "data_type"];

        }

    }

    if (ophys) {

        ophys.required = Object.keys(ophys.properties)

        const getProp = (name: string) => ophys.properties[name]

        const tpsItemSchema = getProp("TwoPhotonSeries")?.items

        if (tpsItemSchema) {

            tpsItemSchema.order = [
                "name",
                "description",
                "scan_line_rate",
                "field_of_view"
            ]

            tpsItemSchema.properties.pmt_gain.title =  'Photomultiplier Gain'
        }


        const imagingPlaneItems = getProp("ImagingPlane")?.items

        if (imagingPlaneItems) {
            imagingPlaneItems.order = [
                "name",
                "description",
                "device",
                "optical_channel",
                "excitation_lambda",
                "indicator",
                "location",
                "reference_frame",
                "imaging_rate",
                'grid_spacing',
                "grid_spacing_unit",
                "origin_coords",
                'origin_coords_unit'
            ]

            imagingPlaneItems.properties.optical_channel.items.order = ["name", "description"]

        }
    }


    Object.entries(copy.properties).forEach(([key, value]) => {

        Object.entries(value.properties).forEach(([k, v]) => {

            //  Uniformly grab definitions
           const ref = v.items ?? v
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

            const requiredSet = new Set(schema.required)

            instanceSpecificFields[globalProp]?.forEach((prop) =>  {
                delete schema.properties[prop]
                requiredSet.delete(prop)
            });

            schema.required = Array.from(requiredSet)
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
