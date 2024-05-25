import { baseUrl, onServerOpen } from '../electron/renderer/src/server/globals'
import { isStorybook } from '../electron/renderer/src/dependencies/simple'

const values = { interfaces: {} }
const setReady: any = {}

const createPromise = (prop: string) => new Promise((resolve) => setReady[prop] = (value) => {
    values[prop] = value
    resolve(value)
})

export const ready = {
    interfaces: createPromise("interfaces"),
}

//  Fetch data formats
onServerOpen(async () => {
    await fetch(`${baseUrl}/neuroconv`).then((res) => res.json())
    .then((interfaces) => setReady.interfaces(interfaces))
    .catch(() => {
        if (isStorybook) setReady.interfaces({})
    });
});

export default values
