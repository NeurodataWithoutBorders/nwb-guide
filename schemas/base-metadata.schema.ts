import baseMetadataSchema from './json/base_metadata_schema.json' assert { type: "json" }

export const preprocessMetadataSchema = (schema: any = baseMetadataSchema) => {

    // Add unit to weight
    schema.properties.Subject.properties.weight.unit = 'kg'

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
