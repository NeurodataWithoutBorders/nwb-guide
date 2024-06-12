import { notify } from './dependencies'
export const onThrow = (message: string, id?: string) => notify(id ? `<b>[${id}]</b>: ${message}` : message, "error", 7000);