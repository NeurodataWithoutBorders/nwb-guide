import { Dandiset } from 'dandi'
import { global } from '../src/renderer/src/progress'
import upload from './json/dandi/upload.json' assert { type: "json" }
import { isStaging } from '../src/renderer/src/stories/pages/uploads/utils'
import { baseUrl, onServerOpen } from '../src/renderer/src/server/globals'

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
        number_of_jobs.max = number_of_jobs.default = physical;
        number_of_threads.max = number_of_threads.default = logical / physical;
        setReady.cpus({ number_of_jobs, number_of_threads })
    })
    .catch(() => {});
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

    const url = new URL(`dandisets/?user=me`, `https://${staging ? 'api-staging' : 'api'}.dandiarchive.org/api/`)
    return await fetch(url, { headers: { 'Authorization': `token ${token}` } })
        .then(res => res.json())
        .then(({ results }) => results.map(addDandiset))

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

    info = new Dandiset(info, { type: staging ? "staging" : undefined })

    const latestVersionInfo = (info.most_recent_published_version ?? info.draft_version)!
    idSchema.enumLabels[id] = `${latestVersionInfo.name}`

    const isDraft = latestVersionInfo.version === 'draft'
    idSchema.enumCategories[id] = (staging ? 'Staging' : 'Main') + (isDraft ? ' — Draft' : '')
    idSchema.enumKeywords[id] = [ id ]

    const fullInfo = await info.getInfo({ type: staging ? "staging" : undefined, version: latestVersionInfo.version });
    idSchema.enumKeywords[id] = [ `${id}${fullInfo.description ? ` — ${fullInfo.description}` : ''}` ]

}

regenerateDandisets({ newPromise: false })

export default schema
