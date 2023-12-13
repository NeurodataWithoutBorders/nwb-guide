import { Dandiset, getMine } from 'dandi'

import { global } from '../src/renderer/src/progress'
import upload from './json/dandi/upload.json' assert { type: "json" }
import { isStaging } from '../src/renderer/src/stories/pages/uploads/utils'
import { baseUrl, onServerOpen } from '../src/renderer/src/server/globals'
import { isStorybook } from '../src/renderer/src/dependencies/simple'

const schema = structuredClone(upload)
const idSchema = schema.properties.dandiset as any
Object.assign(idSchema, {
    strict: false
})

const setReady: any = {}

const createPromise = (prop: string) => new Promise((resolve) => setReady[prop] = resolve)

export const ready = {
    dandisets: createPromise("dandisets"),
    cpus: createPromise("cpus"),
}

//  Get CPUs
onServerOpen(async () => {
    await fetch(new URL("cpus", baseUrl))
    .then((res) => res.json())
    .then(({ physical, logical }) => {
        const { number_of_jobs, number_of_threads } = schema.properties.additional_settings.properties as any;
        number_of_jobs.max = physical;
        number_of_threads.max = logical / physical;
        setReady.cpus({ number_of_jobs, number_of_threads })
    })
    .catch(() => {
        if (isStorybook) setReady.cpus({ number_of_jobs: { max: 1, default: 1 }, number_of_threads: { max: 1, default: 1 } })
    });
});

// Resolve Dandiset Information Asynchronously
export const regenerateDandisets = async ({
    newPromise = true
} = {}) => {
    if (newPromise) ready.dandisets = createPromise("dandiset")
    delete idSchema.enum
    delete idSchema.enumLabels
    delete idSchema.enumKeywords
    delete idSchema.enumCategories
    await updateDandisets()
    await updateDandisets(false)
    setReady.dandisets(idSchema)
}

export const updateDandisets = async (main = true) => {

    const staging = !main

    // Fetch My Dandisets
    const whichAPIKey = staging ? "staging_api_key" : "main_api_key";
    const DANDI = global.data.DANDI;
    let token = DANDI?.api_keys?.[whichAPIKey];

    if (!token) return []

    return await getMine({ token, type: staging ? 'staging' : undefined })
        .then((results) => results ? Promise.all(results.map(addDandiset)) : [])
        .catch(e => {
            console.error(e)
            return []
        })

}

export const addDandiset = async (info) => {

    const isId = typeof info === 'string'
    const id = isId ? info : info.identifier

    if (!idSchema.enum) idSchema.enum = []
    if (!idSchema.enumLabels) idSchema.enumLabels = {}
    if (!idSchema.enumKeywords) idSchema.enumKeywords = {}
    if (!idSchema.enumCategories) idSchema.enumCategories = {}


    const enumSet = new Set(idSchema.enum)
    enumSet.add(id)
    idSchema.enum = Array.from(enumSet)

    const staging = isStaging(id)

    if (!idSchema.enumLabels) idSchema.enumLabels = {}
    if (!idSchema.enumKeywords) idSchema.enumKeywords = {}
    if (!idSchema.enumCategories) idSchema.enumCategories = {}


    const token = global.data.DANDI.api_keys[staging ? "staging_api_key" : "main_api_key"];

    info = new Dandiset(info, { type: staging ? "staging" : undefined, token })

    const latestVersionInfo = (info.most_recent_published_version ?? info.draft_version)!
    const enumLabels = `${id} — ${latestVersionInfo.name}`

    const isDraft = latestVersionInfo.version === 'draft'
    const enumCategories = (isDraft ? 'Drafts — ' : '') + (staging ? 'Staging' : 'Main')

    const fullInfo = await info.getInfo({ version: latestVersionInfo.version });

    const enumKeywords = fullInfo.description ? [ fullInfo.description ] : []

    const idInfo = {
        id,
        enumLabels,
        enumCategories,
        enumKeywords,
    }

    idSchema.enumLabels[id] = idInfo.enumLabels
    idSchema.enumCategories[id] = idInfo.enumCategories
    idSchema.enumKeywords[id] = idInfo.enumKeywords

    return idInfo
}

regenerateDandisets({ newPromise: false })

export default schema
