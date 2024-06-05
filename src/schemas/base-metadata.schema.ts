import { serverGlobals, resolve } from '../electron/frontend/core/server/globals'

import { header, replaceRefsWithValue } from '../electron/frontend/core/components/forms/utils'

import baseMetadataSchema from './json/base_metadata_schema.json' assert { type: "json" }

import { merge } from '../electron/frontend/core/components/pages/utils'
import { drillSchemaProperties } from '../electron/frontend/core/components/pages/guided-mode/data/utils'
import { getISODateInTimezone } from './timezone.schema'


const UV_MATH_FORMAT = `&micro;V`; //`<math xmlns="http://www.w3.org/1998/Math/MathML"><mo>&micro;</mo><mi>V</mi></math>`
const UV_PROPERTIES = ["gain_to_uV", "offset_to_uV"]
const COLUMN_SCHEMA_ORDER = ["name", "description", "data_type"]

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


function updateEcephysTable(propName, schema, schemaToMerge) {

    const ecephys = schema.properties.Ecephys

    // Change rendering order for electrode table columns
    const electrodesProp = ecephys.properties[propName]
    if (!electrodesProp) return false
    for (let name in electrodesProp.properties) {

        const itemSchema = electrodesProp.properties[name].items

        // Do not add new items
        const updateCopy = structuredClone(schemaToMerge)
        const updateProps = updateCopy.properties
        for (let itemProp in updateProps) {
            if (!itemSchema.properties[itemProp]) delete updateProps[itemProp]
        }

        // Merge into existing items
        merge(updateCopy, itemSchema)
    }


    return true

}

export const preprocessMetadataSchema = (schema: any = baseMetadataSchema, global = false) => {


    const copy = replaceRefsWithValue(structuredClone(schema))

    // NEUROCONV PATCH: Correct for incorrect array schema
    drillSchemaProperties(
        copy,
        (_, schema) => {
            if (schema.properties && schema.type === "array") {
                schema.items = { type: "object", properties: schema.properties, required: schema.required };
                delete schema.properties;
                delete schema.required;
            }
        },
        {}
    );

    copy.additionalProperties = false


    copy.required = Object.keys(copy.properties) // Require all properties at the top level

    copy.order = [ "NWBFile", "Subject" ]

    const minDate = "1900-01-01T00:00"

    // Set the maximum at tomorrow
    const nextDay = new Date()
    nextDay.setDate(nextDay.getDate() + 1)
    const maxDate = getISODateInTimezone(nextDay).slice(0, -2) // Restrict date to tomorrow (with timezone awareness)


    // Add unit to weight
    const subjectProps = copy.properties.Subject.properties
    subjectProps.weight.unit = 'kg'

    // subjectProps.order = ['weight', 'age', 'age__reference', 'date_of_birth', 'genotype', 'strain']

    subjectProps.sex.enumLabels = {
        M: 'Male',
        F: 'Female',
        U: 'Unknown',
        O: 'Other',
        XX: 'Hermaphrodite — C. elegans',
        XO: 'Male — C. elegans'
    }

    subjectProps.species = {
        type: 'string',
        strict: false,
        description: 'The species of your subject.'
    }

    subjectProps.date_of_birth.minimum = minDate
    subjectProps.date_of_birth.maximum = maxDate

    // copy.order = ['NWBFile', 'Subject']

    const nwbProps = copy.properties.NWBFile.properties
    copy.properties.NWBFile.title = 'General Metadata'

    nwbProps.session_start_time.minimum = minDate
    nwbProps.session_start_time.maximum = maxDate

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

        ecephys.order = ["Device", "ElectrodeGroup"]
        ecephys.properties.Device.title = 'Devices'
        ecephys.properties.ElectrodeGroup.title = 'Electrode Groups'

        if (ecephys.properties.ElectrodeColumns)  ecephys.properties.ElectrodeColumns.items.order = COLUMN_SCHEMA_ORDER
        if (ecephys.properties.UnitColumns)  ecephys.properties.UnitColumns.items.order = COLUMN_SCHEMA_ORDER


        updateEcephysTable("Electrodes", copy, {
            properties: UV_PROPERTIES.reduce((acc, prop) => {
                acc[prop] = { title: prop.replace('uV', UV_MATH_FORMAT) }
                return acc
            }, {}),
            order: ["channel_name", "group_name", "shank_electrode_number", ...UV_PROPERTIES]
        })

        const units = ecephys.properties["Units"]

        if (units) {

            units.title = "Summarized Units"

            updateEcephysTable("Units", copy, {
                properties: {
                    clu_id: {
                        title: 'Cluster ID',
                    }
                },
                order: ["unit_id", "unit_name", "clu_id", "group_id"]
            })
        }

    }

    if (ophys) {

        ophys.required = Object.keys(ophys.properties).filter(prop => prop !== 'definitions')

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
