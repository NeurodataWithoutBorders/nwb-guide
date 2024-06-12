import { baseUrl, onServerOpen } from "../electron/frontend/core/server/globals";
import { isStorybook } from '../electron/frontend/core/globals'
import { header } from "../electron/frontend/core/components/forms/utils";

const setReady: any = {}

const createPromise = (prop: string) => new Promise((resolve) => setReady[prop] = resolve)

export const ready = {
    timezones: createPromise("timezones"),
    timezone: createPromise("timezone"),
}

//  Get timezones
onServerOpen(async () => {
    await fetch(new URL("/system/all_timezones", baseUrl))
    .then((res) => res.json())
    .then((timezones) => setReady.timezones(timezones))
    .catch(() => {
        if (isStorybook) setReady.timezones([])
    });
});

//  Get timezone
onServerOpen(async () => {
    await fetch(new URL("/system/local_timezone", baseUrl))
    .then((res) => res.json())
    .then((timezone) => setReady.timezone(timezone))
    .catch(() => {
        if (isStorybook) setReady.timezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    });
});

export const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// export const getTimeZoneName = (timezone, timeZoneName = 'long') => new Date().toLocaleDateString(undefined, {day:'2-digit', timeZone: timezone, timeZoneName }).substring(4)

// NOTE: Used before validation and conversion to add timezone information to the data
export const timezoneProperties = [
    [ "NWBFile", "session_start_time" ],
    [ "Subject", "date_of_birth" ]
]

const timezoneSchema = {
    type: "string",
    description: "Provide a base timezone for all date and time operations in the GUIDE.",
    enum: [ localTimeZone ],
    default: localTimeZone,
    strict: true
}

ready.timezones.then((timezones) => {
    ready.timezone.then((timezone) => {

        timezoneSchema.strict = true
        timezoneSchema.search = true

        const filteredTimezones = timezoneSchema.enum = timezones.filter(tz => {
            return tz.split('/').length > 1
            && !tz.toLowerCase().includes('etc/')
        });

        if (!filteredTimezones.includes(timezone)) filteredTimezones.push(timezone) // Add the local timezone if it's not in the list

        timezoneSchema.enumLabels = filteredTimezones.reduce((acc, tz) => {
            const [ _, ...other ] = tz.split('/')
            acc[tz] = other.map(part => header(part)).join(' — ')
            return acc
        }, {})

        timezoneSchema.enumKeywords = filteredTimezones.reduce((acc, tz) => {
            const [ region ] = tz.split('/')
            acc[tz] = [ header(region) ]
            return acc
        }, {})

        timezoneSchema.enumCategories =  filteredTimezones.reduce((acc, tz) => {
            const [ region ] = tz.split('/')
            acc[tz] = region
            return acc
        }, {})

        timezoneSchema.default = timezone;
    })
})

export default timezoneSchema
