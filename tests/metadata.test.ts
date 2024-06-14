import { describe, expect, test } from 'vitest'
import { createResultsForSession } from '../src/electron/frontend/utils/data'
import { mapSessions } from '../src/electron/frontend/utils/data'

import baseMetadataSchema from '../src/schemas/base-metadata.schema'

import { createMockGlobalState } from './utils'

import { Validator } from 'jsonschema'
import { updateResultsFromSubjects } from '../src/electron/frontend/utils/data'


var validator = new Validator();


describe('metadata is specified correctly', () => {

    test('session-specific metadata is merged with project and subject metadata correctly', () => {
        const globalState = createMockGlobalState()

        // Allow mouse (full list populated from server)
        baseMetadataSchema.properties.Subject.properties.species.enum = ['Mus musculus']

        const result = mapSessions(info => createResultsForSession(info, globalState), globalState.results)
        const res = validator.validate(result[0], baseMetadataSchema) // Check first session with JSON Schema
        expect(res.errors).toEqual([])
    })
})

test('removing all existing sessions will maintain the related subject entry on the results object', () => {
    const results = { subject: { original: {} } }

    const copy = JSON.parse(JSON.stringify(results))

    const subjects = { subject: { sessions: ['renamed'] } }

    updateResultsFromSubjects(results, subjects)
    expect(Object.keys(results)).toEqual(Object.keys(copy))
})
