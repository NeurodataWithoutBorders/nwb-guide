import { getResourceUsage } from "../src/renderer/src/validation/backend-configuration"

export const getSchema = (schema) => {


    const copy = structuredClone(schema)

    return copy

}

export const resolveBackendResults = (schema, results, itemsize) => {
    const copy = getSchema(schema)


    // results.buffer_shape = results.chunk_shape.map(() => null); // Provide an unspecified buffer shape for now

    // Do not handle compression options or any filter options for now
    if (copy.properties.compression_options) results.compression_options = null;
    if (copy.properties.filter_methods) results.filter_methods = []
    if (copy.properties.filter_options) results.filter_options = null;


    const { full_shape } = results;
    if (copy.properties.filter_methods) copy.properties.filter_methods.description = "The ordered collection of filtering methods to apply to this dataset prior to compression.<br/><small>Set blank to disable filtering</small>"
    copy.properties.compression_method.description = "The specified compression method to apply to this dataset.<br/><small>Set blank to disable compression</small>"
    copy.description = `<b>Full Shape:</b> ${full_shape}<br/><b>Source size:</b> ${getResourceUsage(full_shape, itemsize).toFixed(2)} GB`; // This is static

    updateSchema(copy, results, itemsize)

    return { schema: copy, resolved: results }
}


const propertiesToUpdate = [
    'chunk_shape',
    // 'buffer_shape'
]

// const bufferShapeDescription = (value, itemsize) => {
//     return `Expected RAM usage: ${getResourceUsage(value, itemsize).toFixed(2)} GB.`;
// }

const chunkShapeDescription = (value, itemsize) => {
    const hasNull = value.includes(null) || value.includes(undefined); // Both null after JSON processing
    const diskSpaceMessage = hasNull ? 'Disk space usage will be determined automatically' : `Disk space usage per chunk: ${getResourceUsage(value, itemsize, 1e6).toFixed(2)} MB`;
    return `${diskSpaceMessage}<br/><small>Leave blank to auto-specify the axis</small>`;
}


export const updateSchema = (schema, results, itemsize) => {

    const {
        chunk_shape,
        // buffer_shape,
        full_shape
    } = results;


    const chunkSchema = schema.properties.chunk_shape;
    const chunkArraySchema = chunkSchema.anyOf?.[0] || chunkSchema;
    // const bufferSchema = schema.properties.buffer_shape;

    const shapeMax = full_shape[0]

    if (propertiesToUpdate.includes('chunk_shape')) {
        chunkArraySchema.items.minimum = 1
        chunkArraySchema.maxItems = chunkArraySchema.minItems = chunk_shape.length;
        chunkArraySchema.items.maximum = shapeMax
        chunkArraySchema.description = chunkShapeDescription(
            chunk_shape,
            itemsize
        );

    }

    // if (propertiesToUpdate.includes('buffer_shape')) {
    //     bufferSchema.items.minimum = 1
    //     bufferSchema.items.maximum = shapeMax
    //     bufferSchema.items.step = chunk_shape[0] // Constrain to increments of chunk size
    //     bufferSchema.strict = true

    //     bufferSchema.maxItems = bufferSchema.minItems = buffer_shape.length;
    //     bufferSchema.description = bufferShapeDescription(
    //         buffer_shape,
    //         itemsize
    //     );
    // }
}
