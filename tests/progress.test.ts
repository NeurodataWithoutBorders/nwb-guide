import { expect, test } from 'vitest'
import { updateAppProgress, updateFile, rename } from '../src/renderer/src/progress/update'
import { get } from '../src/renderer/src/progress'
import { remove } from '../src/renderer/src/progress/operations'

test('updates to app progress do not fail', () => updateAppProgress('/', {}))

const initialName = '.progressTestPipelineName'
const renameName = initialName + 2
const info = { random: Math.random() }

// Remove before tests
remove(initialName)
remove(renameName)

// create pipeline
test('pipeline creation works', () => {
    updateFile(initialName, () => info)
    const result = get(initialName)
    expect(result.random).toEqual(info.random) // NOTE: Result has an extra lastModified field
})

// rename pipeline
test('pipeline renaming works', () => rename(renameName, initialName))

// delete pipeline
test('pipeline deletion works', () => remove(renameName))
