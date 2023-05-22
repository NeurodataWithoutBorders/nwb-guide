import { describe, expect, test } from 'vitest'
import { createResults } from '../src/renderer/src/stories/pages/guided-mode/data/utils'
import { mapSessions } from '../src/renderer/src/stories/pages/utils'

import baseMetadataSchema from '../schemas/base-metadata.schema'

import { createMockGlobalState } from './utils'

import { Validator } from 'jsonschema'
import { textToArray } from '../src/renderer/src/stories/forms/utils'
import { convertSubjectsToResults } from '../src/renderer/src/stories/pages/guided-mode/setup/utils'

var v = new Validator();

describe('metadata is specified correctly', () => {

    test('session-specific metadata is merged with project and subject metadata correctly', () => {
        const globalState = createMockGlobalState()
        const result = mapSessions(info => createResults(info, globalState), globalState)
        const res = v.validate(result[0], baseMetadataSchema) // Check first session with JSON Schema
        expect(res.errors).toEqual([])
    })
})

test('empty rows are not kept for strings converted to arrays', () => {
    expect(textToArray(' v1\n v2 ')).toEqual(['v1', 'v2'])
    expect(textToArray(' v1\n\n   v2 ')).toEqual(['v1', 'v2'])
    expect(textToArray(' v1\n \n   v2 ')).toEqual(['v1', 'v2'])
    expect(textToArray(' v1\n v3\n   v2 ')).toEqual(['v1', 'v3', 'v2'])
})

test('removing all existing sessions will maintain the related subject entry on the results object', () => {
    const results = { subject: { original: {} } }

    const copy = JSON.parse(JSON.stringify(results))

    const subjects = { subject: { sessions: ['renamed'] } }

    convertSubjectsToResults(results, subjects)
    expect(Object.keys(results)).toEqual(Object.keys(copy))
})
