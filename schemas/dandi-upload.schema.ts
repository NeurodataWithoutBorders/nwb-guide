import { get } from 'dandi'
import { global } from '../src/renderer/src/progress'
import upload from './json/dandi/upload.json' assert { type: "json" }
import { isStaging } from '../src/renderer/src/stories/pages/uploads/utils'

const schema = structuredClone(upload)
const idSchema = schema.properties.dandiset
Object.assign(idSchema, {
    enum: Object.keys(global.data.DANDI?.dandisets ?? {}),
    strict: false
})

// Resolve Dandiset Information Asynchronously
const toResolve = {
    enumLabels: {},
    enumKeywords: {},
    enumCategories: {}
}

Promise.all(Object.keys(global.data.DANDI?.dandisets ?? {}).map(async (id) => {
    const staging = isStaging(id)
    const dandiset = await get(id, { type: staging ? "staging" : undefined });

    // NOTE: Encapsulate in macros...
    const latestVersionInfo = (dandiset.most_recent_published_version ?? dandiset.draft_version)!
    const isDraft = latestVersionInfo.version === 'draft'

    const fullInfo = await dandiset.getInfo({ type: staging ? "staging" : undefined, version: latestVersionInfo.version });
    toResolve.enumLabels[id] = `${latestVersionInfo.name} - ${id}`
    toResolve.enumKeywords[id] = [ fullInfo.description ]
    toResolve.enumCategories[id] = (staging ? 'Staging' : 'Main') + (isDraft ? ' — Draft' : '')

}, {}))

.then(() => Object.assign(idSchema, toResolve))

export default schema
