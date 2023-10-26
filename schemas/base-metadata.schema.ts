import baseMetadataSchema from './json/base_metadata_schema.json' assert { type: "json" }

export const preprocessMetadataSchema = (schema: any = baseMetadataSchema) => {

    // Add unit to weight
    schema.properties.Subject.properties.weight.unit = 'kg'

    // Override description of keywords
    schema.properties.NWBFile.properties.keywords.description = 'Terms to describe your dataset (e.g. Neural circuits, V1, etc.)' // Add description to keywords
    return schema

}

export default preprocessMetadataSchema()
