import { localTimeZone } from "../../../schemas/timezone.schema";

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
