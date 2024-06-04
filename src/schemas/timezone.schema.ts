import { header } from "../electron/frontend/core/components/forms/utils";


export const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const getTimeZoneName = (timezone, timeZoneName = 'long') => new Date().toLocaleDateString(undefined, {day:'2-digit', timeZone: timezone, timeZoneName }).substring(4)

const timezones = Intl.supportedValuesOf('timeZone');
if (!timezones.includes(localTimeZone)) timezones.push(localTimeZone); // Add the local timezone if it's not already in the list

const enumCategories = timezones.reduce((acc, timezone) => {
    const parts = timezone.split("/");
    const category = parts.length === 1 ? "Other" : parts[0];
    acc[timezone] = category;
    return acc;
}, {});

const enumLabels = timezones.reduce((acc, timezone) => {
    const parts = timezone.split("/");
    const nonCategoryParts = parts.slice(1, parts.length - 1);
    acc[timezone] = header(parts[parts.length - 1]);
    if (nonCategoryParts.length) acc[timezone] += ` — ${nonCategoryParts.map(str => header(str)).join(", ")}`
    return acc;
}, {});


const enumKeywords = timezones.reduce((acc, timezone) => {
    acc[timezone] = [ getTimeZoneName(timezone, 'long'), getTimeZoneName(timezone, 'short') ]
    return acc;
}, {});


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


export default {
    type: "string",
    description: "Provide a base timezone for all date and time operations in the GUIDE.",
    default: localTimeZone,
    enum: timezones,
    enumLabels,
    enumKeywords,
    enumCategories,
    strict: true,
    search: true
}
