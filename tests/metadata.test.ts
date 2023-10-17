import { describe, expect, test } from 'vitest'
import { createResults } from '../src/renderer/src/stories/pages/guided-mode/data/utils'
import { mapSessions } from '../src/renderer/src/stories/pages/utils'

import baseMetadataSchema from '../schemas/base-metadata.schema'

import { createMockGlobalState } from './utils'

import { Validator } from 'jsonschema'
import { textToArray } from '../src/renderer/src/stories/forms/utils'
import { updateResultsFromSubjects } from '../src/renderer/src/stories/pages/guided-mode/setup/utils'
import { JSONSchemaForm } from '../src/renderer/src/stories/JSONSchemaForm'

import { validateOnChange } from "../src/renderer/src/validation/index.js";
import { SimpleTable } from '../src/renderer/src/stories/SimpleTable'

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

    updateResultsFromSubjects(results, subjects)
    expect(Object.keys(results)).toEqual(Object.keys(copy))
})


// TODO: Convert an integration
test('inter-table updates are triggered', async () => {

    const results = {
        Ecephys: { // NOTE: This layer is required to place the properties at the right level for the hardcoded validation function
            ElectrodeGroup: [ { name: 's1' } ],
            Electrodes: [{ group_name: 's1' }]
        }
    }

    const schema = {
        properties: {
            Ecephys: {
                properties: {
                    ElectrodeGroup: {
                        type: "array",
                        items: {
                            required: ["name"],
                            properties: {
                                name: {
                                    type: "string"
                                },
                            },
                            type: "object",
                        },
                    },
                    Electrodes: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                group_name: {
                                    type: "string",
                                },
                            },
                        }
                    },
                }
            }
        }
    }



    // Add invalid electrode
    const randomStringId = Math.random().toString(36).substring(7)
    results.Ecephys.Electrodes.push({ group_name: randomStringId })

    // Create the form
    const form = new JSONSchemaForm({
        schema,
        results,
        validateOnChange,
        renderTable: (name, metadata, path) => {
            if (name !== "Electrodes") return new SimpleTable(metadata);
        },
    })

    document.body.append(form)

    await form.rendered

    // Validate that the results are incorrect
    let errors = false
    await form.validate().catch(e => errors = true)
    expect(errors).toBe(true) // Is invalid

    // Update the table with the missing electrode group
    const table = form.getTable(['Ecephys', 'ElectrodeGroup']) // This is a SimpleTable where rows can be added
    const row = table.addRow()

    const baseRow = table.getRow(0)
    row.forEach((cell, i) => {
        if (cell.simpleTableInfo.col === 'name') cell.value = randomStringId // Set name to random string id
        else cell.value = baseRow[i].value // Otherwise carry over info
    })

    // Validate that the new structure is correct
    await form.validate().then(res => errors = false).catch(e => errors = true)
    expect(errors).toBe(false) // Is valid
})


// TODO: Convert an integration
test('changes are resolved correctly', async () => {

    const results = {}
    const schema = {
        properties: {
            v0: {
                type: 'string'
            },
            l1: {
                type: "object",
                properties: {
                    l2: {
                        type: "object",
                        properties: {
                            l3: {
                                type: "object",
                                properties: {
                                    v2: {
                                        type: 'string'
                                    }
                                },
                                required: ['v2']
                            },
                        },
                    },
                    v1: {
                        type: 'string'
                    }
                },
                required: ['v1']
            }
        },
        required: ['v0']
    }

    // Create the form
    const form = new JSONSchemaForm({
        schema,
        results
    })

    document.body.append(form)

    await form.rendered

    // Validate that the results are incorrect
    let errors = false
    await form.validate().catch(e => errors = true)
    expect(errors).toBe(true) // Is invalid

    const input1 = form.getInput(['v0'])
    const input2 = form.getInput(['l1', 'v1'])
    const input3 = form.getInput(['l1', 'l2', 'l3', 'v2'])

    input1.updateData('test')
    input2.updateData('test')
    input3.updateData('test')

    // Validate that the new structure is correct
    await form.validate(form.results).then(res => errors = false).catch(e => errors = true)
    expect(errors).toBe(false) // Is valid
})
