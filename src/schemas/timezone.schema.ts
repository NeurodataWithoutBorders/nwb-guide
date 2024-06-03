
// const timezones = Intl.supportedValuesOf('timeZone');

const mostCommonTimezonesWithUTCOffset = {
    'Pacific/Honolulu': '-10:00',
    'America/Anchorage': '-09:00',
    'America/Los_Angeles': '-08:00',
    'America/Denver': '-07:00',
    'America/Chicago': '-06:00',
    'America/New_York': '-05:00',
    'America/Sao_Paulo': '-03:00',
    'Atlantic/Azores': '-01:00',
    'Europe/London': '+00:00',
    'Europe/Paris': '+01:00',
    'Europe/Athens': '+02:00',
    'Asia/Jerusalem': '+02:00',
    'Europe/Moscow': '+03:00',
    'Asia/Dubai': '+04:00',
    'Asia/Karachi': '+05:00',
    'Asia/Dhaka': '+06:00',
    'Asia/Jakarta': '+07:00',
    'Asia/Shanghai': '+08:00',
    'Asia/Tokyo': '+09:00',
    'Australia/Sydney': '+10:00',
    'Pacific/Auckland': '+12:00'
};


export const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default {
    type: "string",
    description: "Provide a base timezone for all date and time operations in the GUIDE.",
    default: localTimeZone,
    enum: Object.keys(mostCommonTimezonesWithUTCOffset),
    enumLabels: Object.entries(mostCommonTimezonesWithUTCOffset).reduce((acc, [ name, offset ]) => {
        acc[name] = `${name} (${offset})`
        return acc
    }),
    strict: true
}