import { global } from '../src/renderer/src/progress'
import upload from './json/dandi/upload.json' assert { type: "json" }

// NOTE: Dependent on other PR
const schema = structuredClone(upload)
const idSchema = schema.properties.dandiset_id
Object.assign(idSchema, {
    enum: Object.keys(global.data.DANDI?.dandisets ?? {}),
    strict: false
})


export default schema
