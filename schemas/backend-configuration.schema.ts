import { isStorybook } from "../src/renderer/src/dependencies/simple"
import { baseUrl, onServerOpen } from "../src/renderer/src/server/globals"

const schema = {
    type: "object",
    order: ["filter_methods", "compression_method", "compression_options", "chunk_shape", "buffer_shape"],
    properties: {
        full_shape: {
            type: 'array',
            items: {
                type: 'number'
            }
        },
        chunk_shape: {
            type: 'array',
            items: {
                type: 'number'
            }
        },
        buffer_shape: {
            type: 'array',
            items: {
                type: 'number'
            }
        },
        compression_method: {
            type: 'string',
            enum: ['gzip'],
            strict: true
        },
        filter_methods: {
            type: 'array',
            placeholder: 'Select a method',
            empty: 'No methods selected',
            items: {
                type: 'string'
            }
        },
        compression_options: {
            type: 'object',
            properties: {}
        },
        filter_options: {
            type: 'array',
            items: {
                type: 'object',
                properties: {}
            }
        }
    },
    // additionalProperties: false,
}

const resolved = {}

const sharedCompressionMethods = [ "gzip" ]

export const getSchema = (method='hdf5') => {
    const copy = structuredClone(schema)
    copy.properties["compression_method"].enum = resolved[method] ?? sharedCompressionMethods
    return copy
}


const setReady: any = {}

const createPromise = (prop: string) => new Promise((resolve) => setReady[prop] = (v) => {
    resolved[prop] = v
    resolve(v)
})

export const ready = {
    compression: {
        hdf5: createPromise("hdf5"),
        zarr: createPromise("zarr"),
    }
}

// Get Compression Options
onServerOpen(async () => {
    await fetch(new URL("/compression/hdf5", baseUrl))
    .then((res) => res.json())
    .then((opts) => setReady.hdf5(opts))
    .catch(() => isStorybook ? setReady.hdf5([]) : '');
});


onServerOpen(async () => {
    await fetch(new URL("/compression/zarr", baseUrl))
    .then((res) => res.json())
    .then((opts) => setReady.zarr(opts))
    .catch(() => isStorybook ? setReady.zarr([]) : '');
});
