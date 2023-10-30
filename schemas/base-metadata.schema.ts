import baseMetadataSchema from './json/base_metadata_schema.json' assert { type: "json" }

baseMetadataSchema.properties.Subject.properties.weight.unit = 'kg' // Add unit to weight


export default baseMetadataSchema


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


const globalSchema = structuredClone(baseMetadataSchema);
Object.entries(globalSchema.properties).forEach(([globalProp, schema]) => {
    instanceSpecificFields[globalProp]?.forEach((prop) =>  delete schema.properties[prop]);
});

export {
    globalSchema
}