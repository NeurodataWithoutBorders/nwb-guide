import baseMetadataSchema from './json/base_metadata_schema.json' assert { type: "json" }

export const preprocessMetadataSchema = (schema: any = baseMetadataSchema) => {

    // Add unit to weight
    const subjectProps = schema.properties.Subject.properties
    subjectProps.weight.unit = 'kg'

    subjectProps.sex.enumLabels = {
        M: 'Male',
        F: 'Female',
        U: 'Unknown',
        O: 'Other'
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
    
      subjectProps.species = {
        type: 'string',
        // enumLabels: 
        enum: species, // Remove common names so this passes the validator
        items: {
            type: 'string'
        },
        strict: false,
        description: 'The species of your subject.'
    }

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
