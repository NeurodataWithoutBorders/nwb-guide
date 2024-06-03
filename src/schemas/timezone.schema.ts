
const timezones = Intl.supportedValuesOf('timeZone');

export const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default {
    type: "string",
    description: "Provide a base timezone for all date and time operations in the GUIDE.",
    default: localTimeZone,
    enum: timezones,
    strict: true,
    search: true
}
