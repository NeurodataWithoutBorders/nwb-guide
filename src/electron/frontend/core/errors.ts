import { notify } from './dependencies'

export const onThrow = (message: string, id?: string) => {
    return notify(id ? `<b>[${id}]</b>: ${message}` : message, "error", 7000);
}
