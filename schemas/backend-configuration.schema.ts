import { getResourceUsage } from "../src/renderer/src/validation/backend-configuration"

export const getSchema = (schema) => {


    const copy = structuredClone(schema)

    // Choose anyOf value that defines resolved arrays
    Object.entries(copy.properties).forEach(([ key, schema ]) => {
        const anyOf = schema.anyOf
        if (anyOf) {
            delete schema.anyOf
            copy.properties[key] = {...schema, ...anyOf[0]}
        }
    })


    return copy

}

export const resolveBackendResults = (schema, results, itemsize) => {
    const copy = getSchema(schema)

    if (!results.compression_options) results.compression_options = {}; // Set blank compression options to an empty object

    if (schema.properties.filter_methods && !results.filter_methods) results.filter_methods = []
    if (schema.properties.filter_options && !results.filter_options) results.filter_options = []; // Set blank compression options to an empty object

    const { full_shape } = results;

    copy.description = `Full Shape: ${full_shape} | Source size: ${getResourceUsage(full_shape, itemsize).toFixed(2)} GB`; // This is static

    updateSchema(copy, results, itemsize)

    return { schema: copy, resolved: results }
}


const propertiesToUpdate = [ 'chunk_shape', 'buffer_shape' ]

const bufferShapeDescription = (value, itemsize) => {
    return `Expected RAM usage: ${getResourceUsage(value, itemsize).toFixed(2)} GB.`;
}
const chunkShapeDescription = (value, itemsize) => {
    return `Disk space usage per chunk: ${getResourceUsage(value, itemsize, 1e6).toFixed(2)} MB.`;
}


export const updateSchema = (schema, results, itemsize) => {

    const { chunk_shape, buffer_shape, full_shape } = results;

    const chunkSchema = schema.properties.chunk_shape;
    const bufferSchema = schema.properties.buffer_shape;

    const shapeMax = full_shape[0]

    if (propertiesToUpdate.includes('chunk_shape')) {
        chunkSchema.items.min = bufferSchema.items.min = 1
        chunkSchema.maxItems = chunkSchema.minItems = chunk_shape.length;
        chunkSchema.items.max = shapeMax
        chunkSchema.description = chunkShapeDescription(
            chunk_shape,
            itemsize
        );

    }

    if (propertiesToUpdate.includes('buffer_shape')) {

        bufferSchema.items.max = shapeMax
        bufferSchema.items.step = chunk_shape[0] // Constrain to increments of chunk size
        bufferSchema.strict = true

        bufferSchema.maxItems = bufferSchema.minItems = buffer_shape.length;
        bufferSchema.description = bufferShapeDescription(
            buffer_shape,
            itemsize
        );
    }
}
