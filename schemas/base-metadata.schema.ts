import baseMetadataSchema from './json/base_metadata_schema.json' assert { type: "json" }

baseMetadataSchema.properties.Subject.properties.weight.unit = 'kg' // Add unit to weight


export default baseMetadataSchema
