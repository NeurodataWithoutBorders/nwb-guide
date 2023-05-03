import { describe, expect, test } from 'vitest'
import { createResults } from '../src/renderer/src/stories/pages/guided-mode/data/utils'
import { mapSessions } from '../src/renderer/src/stories/pages/utils'

import baseMetadataSchema from '../schemas/base_metadata_schema.json' assert {type: 'json'}

import { createMockGlobalState } from './utils'

import { Validator } from 'jsonschema'
var v = new Validator();

describe('metadata is specified correctly', () => {

    test('session-specific metadata is merged with project and subject metadata correctly', () => {
        const globalState = createMockGlobalState()
        const result = mapSessions(info => createResults(info, globalState), globalState)
        const res = v.validate(result[0], baseMetadataSchema) // Check first session with JSON Schema
        expect(res.errors).toEqual([])
    })
})