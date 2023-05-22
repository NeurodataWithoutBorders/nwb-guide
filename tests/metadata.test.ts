import { describe, expect, test } from 'vitest'
import { createResults } from '../src/renderer/src/stories/pages/guided-mode/data/utils'
import { mapSessions } from '../src/renderer/src/stories/pages/utils'

import baseMetadataSchema from '../schemas/base-metadata.schema'

import { createMockGlobalState } from './utils'

import { Validator } from 'jsonschema'
import { textToArray } from '../src/renderer/src/stories/forms/utils'
import { convertSubjectsToResults } from '../src/renderer/src/stories/pages/guided-mode/setup/utils'
import { JSONSchemaForm } from '../src/renderer/src/stories/JSONSchemaForm'

import nwbBaseSchema from "../schemas/base-metadata.schema";
import exephysExampleSchema from "../schemas/json/ecephys_metadata_schema_example.json";
import { validateOnChange } from "../src/renderer/src/validation/index.js";
import { testEcephysData } from './data'
import { SimpleTable } from '../src/renderer/src/stories/SimpleTable'

nwbBaseSchema.properties.Ecephys = exephysExampleSchema;

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



// NOTE: This requires a polyfill for Element.after

test('inter-table updates are triggered', async () => {

    const randomStringId = Math.random().toString(36).substring(7)


    // Create dummy results for the form
    const results = {
        NWBFile: {
            session_start_time: (new Date()).toUTCString()
        },
        Subject: {
            subject_id: '00001',
            species: 'Mus musculus'
        },

        Ecephys: testEcephysData
    }

    // Add invalid electrode
    results.Ecephys.Electrodes.push({ ... results.Ecephys.Electrodes[0], group_name: randomStringId })

    // Create the form
    const form = new JSONSchemaForm({
        schema: nwbBaseSchema,
        results,
        validateOnChange,
        renderTable: (name, metadata, path) => {
            if (name !== "ElectrodeColumns" && name !== "Electrodes") return new SimpleTable(metadata);
        },
        mode: 'accordion'
    })

    document.body.append(form)

    await form.rendered

    // Validate that the results are incorrect
    let errors = false
    await form.validate().catch(e => errors = true)
    expect(errors).toBe(true) // Is invalid

    // TODO: Actually update the table with the missing electrode group
    const table = form.getTable(['Ecephys', 'ElectrodeGroup']) // This is a SimpleTable where rows can be added
    const row = table.addRow()

    const baseRow = table.getRow(0)
    row.forEach((cell, i) => {
        if (cell.simpleTableInfo.col === 'name') cell.value = randomStringId // Set name to random string id
        else cell.value = baseRow[i].value // Otherwise carry over info
    })

    // Ensure the rendered attribute has been reset / the cell has been rerendered
    setTimeout(async () => {
        await form.rendered

        // Valalidate that the new structure is correct
        await form.validate().then(res => errors = false).catch(e => {
            console.log('Errors', e)
            errors = true
        })
        expect(errors).toBe(false) // Is valid
    }, 1000)
})
