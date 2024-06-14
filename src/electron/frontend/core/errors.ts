import { notify } from './notifications'
export const onThrow = (message: string, id?: string) => notify(id ? `<b>[${id}]</b>: ${message}` : message, "error", 7000);
