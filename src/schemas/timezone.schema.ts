const timezones = Intl.supportedValuesOf('timeZone');

export const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const getTimezoneOffset = (
    date = new Date(),
    timezone = localTimeZone
) => {
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

    const offset = getTimezoneOffset(date, timezone)
    const adjustedDate = new Date(date.getTime() - offset);
    return adjustedDate.toISOString();
}


export default {
    type: "string",
    description: "Provide a base timezone for all date and time operations in the GUIDE.",
    default: localTimeZone,
    enum: timezones,
    strict: true,
    search: true
}
