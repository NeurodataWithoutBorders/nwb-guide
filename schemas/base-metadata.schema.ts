import baseMetadataSchema from './json/base_metadata_schema.json' assert { type: "json" }


export const preprocessMetadataSchema = (schema: any = baseMetadataSchema) => {

    // Add unit to weight
    schema.properties.Subject.properties.weight.unit = 'kg'

    schema.properties.Subject.properties.sex.enumLabels = {
        M: 'Male',
        F: 'Female',
        U: 'Unknown',
        O: 'Other'
    }

    // Ensure experimenter schema has custom structure
    schema.properties.NWBFile.properties.experimenter = baseMetadataSchema.properties.NWBFile.properties.experimenter

    // Override description of keywords
    schema.properties.NWBFile.properties.keywords.description = 'Terms to describe your dataset (e.g. Neural circuits, V1, etc.)' // Add description to keywords


    const ophys = schema.properties.Ophys

    if (ophys) {

        const defs = ophys.properties.definitions

        if (defs.TwoPhotonSeries) defs.TwoPhotonSeries.order = [
            "name",
            "description",
            "scan_line_rate",
            "field_of_view"
        ]

        if (defs.ImagingPlane) defs.ImagingPlane.order = [
            "name",
            "description",
            "device",
            "optical_channel"
        ]
    }


    Object.entries(schema.properties).forEach(([key, value]) => {

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
