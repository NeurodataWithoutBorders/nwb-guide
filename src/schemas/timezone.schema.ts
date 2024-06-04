import { baseUrl, onServerOpen } from "../electron/frontend/core/server/globals";
import { isStorybook } from '../electron/frontend/core/globals'

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
    .then((timezones) => {
        console.log(timezones);
        setReady.timezones(timezones)
    })
    .catch(() => {
        if (isStorybook) setReady.timezones([])
    });
});

//  Get timezone
onServerOpen(async () => {
    await fetch(new URL("/system/local_timezone", baseUrl))
    .then((res) => res.json())
    .then((timezone) => {
        console.log(timezone);
        setReady.timezone(timezone)
    })
    .catch(() => {
        if (isStorybook) setReady.timezone(null)
    });
});




export const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// export const getTimeZoneName = (timezone, timeZoneName = 'long') => new Date().toLocaleDateString(undefined, {day:'2-digit', timeZone: timezone, timeZoneName }).substring(4)

// NOTE: Used before validation and conversion to add timezone information to the data
export const timezoneProperties = [
    [ "NWBFile", "session_start_time" ],
    [ "Subject", "date_of_birth" ]
]

export const getTimezoneOffset = (
    date = new Date(),
    timezone = localTimeZone
) => {

    if (typeof date === 'string') date = new Date(date)

    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return utcDate.getTime() - tzDate.getTime();
}

export const formatTimezoneOffset = (
    milliseconds: number
) => {
    let offsetInMinutes = -((milliseconds / 1000) / 60); // getTimezoneOffset returns the difference in minutes from UTC
    const sign = offsetInMinutes >= 0 ? "+" : "-";
    offsetInMinutes = Math.abs(offsetInMinutes);
    const hours = String(Math.floor(offsetInMinutes / 60)).padStart(2, "0");
    const minutes = String(offsetInMinutes % 60).padStart(2, "0");
    return `${sign}${hours}:${minutes}`;
}

export function getISODateInTimezone(
    date = new Date(),
    timezone = localTimeZone
) {

    if (typeof date === 'string') date = new Date(date)

    const offset = getTimezoneOffset(date, timezone)
    const adjustedDate = new Date(date.getTime() - offset);
    return adjustedDate.toISOString();
}


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

        timezoneSchema.enumLabels = filteredTimezones.reduce((acc, tz) => {
            const [ region, city ] = tz.split('/')
            acc[tz] = `${city}, ${region}`
            return acc
        })

        timezoneSchema.enumCategories =  filteredTimezones.reduce((acc, tz) => {
            const [ region ] = tz.split('/')
            acc[tz] = region
            return acc
        })

        timezoneSchema.default = timezone;
    })
})

export default timezoneSchema
