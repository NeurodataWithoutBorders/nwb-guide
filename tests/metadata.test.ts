import { describe, expect, test } from 'vitest'
import { createResults } from '../src/renderer/src/stories/pages/guided-mode/data/utils'
import { mapSessions } from '../src/renderer/src/stories/pages/utils'

import baseMetadataSchema from '../schemas/base-metadata.schema'

import { createMockGlobalState } from './utils'

import { Validator } from 'jsonschema'
import { tempPropertyKey, textToArray } from '../src/renderer/src/stories/forms/utils'
import { updateResultsFromSubjects } from '../src/renderer/src/stories/pages/guided-mode/setup/utils'
import { JSONSchemaForm } from '../src/renderer/src/stories/JSONSchemaForm'

import { validateOnChange } from "../src/renderer/src/validation/index.js";
import { SimpleTable } from '../src/renderer/src/stories/SimpleTable'
import { JSONSchemaInput } from '../src/renderer/src/stories/JSONSchemaInput.js'

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var validator = new Validator();

const NWBFileSchemaProperties = baseMetadataSchema.properties.NWBFile.properties

describe('metadata is specified correctly', () => {

    test('session-specific metadata is merged with project and subject metadata correctly', () => {
        const globalState = createMockGlobalState()

        // Allow mouse (full list populated from server)
        baseMetadataSchema.properties.Subject.properties.species.enum = ['Mus musculus']

        const result = mapSessions(info => createResults(info, globalState), globalState.results)
        const res = validator.validate(result[0], baseMetadataSchema) // Check first session with JSON Schema
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

const popupSchemas = {
    "type": "object",
    "required": ["keywords", "experimenter"],
    "properties": {
        "keywords": NWBFileSchemaProperties.keywords,
        "experimenter": NWBFileSchemaProperties.experimenter
    }
}

// Pop-up inputs and forms work correctly
test('pop-up inputs work correctly', async () => {

    const results = {}

    // Create the form
    const form = new JSONSchemaForm({ schema: popupSchemas, results })

    document.body.append(form)

    await form.rendered

    // Validate that the results are incorrect
    let errors = false
    await form.validate().catch(() => errors = true)
    expect(errors).toBe(true) // Is invalid


    // Validate that changes to experimenter are valid
    const experimenterInput = form.getFormElement(['experimenter'])
    const experimenterButton = experimenterInput.shadowRoot.querySelector('nwb-button')
    const experimenterModal = experimenterButton.onClick()
    const experimenterNestedElement = experimenterModal.children[0].children[0]
    const experimenterSubmitButton = experimenterModal.footer

    await sleep(1000)

    let modalFailed
    try {
        await experimenterSubmitButton.onClick()
        modalFailed = false
    } catch (e) {
        modalFailed = true
    }

    expect(modalFailed).toBe(true) // Is invalid

    experimenterNestedElement.updateData(['first_name'], 'Garrett')
    experimenterNestedElement.updateData(['last_name'], 'Flynn')

    experimenterNestedElement.requestUpdate()

    await experimenterNestedElement.rendered

    try {
        await experimenterSubmitButton.onClick()
        modalFailed = false
    } catch (e) {
        modalFailed = true
    }

    expect(modalFailed).toBe(false) // Is valid

    // Validate that changes to keywords are valid
    const keywordsInput = form.getFormElement(['keywords'])
    const input = keywordsInput.shadowRoot.querySelector('input')
    const submitButton = keywordsInput.shadowRoot.querySelector('nwb-button')
    const list = keywordsInput.shadowRoot.querySelector('nwb-list')
    expect(list.items.length).toBe(0) // No items

    input.value = 'test'
    await submitButton.onClick()

    expect(list.items.length).toBe(1) // Has item
    expect(input.value).toBe('') // Input is cleared

    // Validate that the new structure is correct
    const hasErrors = await form.validate(form.results).then(res => false).catch(() => true)

    expect(hasErrors).toBe(false) // Is valid
})

// TODO: Convert an integration
test('inter-table updates are triggered', async () => {

    const results = {
        Ecephys: { // NOTE: This layer is required to place the properties at the right level for the hardcoded validation function
            ElectrodeGroup: [{ name: 's1' }],
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
            else return true
        },
    })

    document.body.append(form)

    await form.rendered

    // Validate that the results are incorrect
    const errors = await form.validate().catch(() => true).catch((e) => e)
    expect(errors).toBe(true) // Is invalid

    // Update the table with the missing electrode group
    const table = form.getFormElement(['Ecephys', 'ElectrodeGroup']) // This is a SimpleTable where rows can be added
    const idx = await table.addRow()

    const row = table.getRow(idx)

    const baseRow = table.getRow(0)
    row.forEach((cell, i) => {
        if (cell.simpleTableInfo.col === 'name') cell.setInput(randomStringId) // Set name to random string id
        else cell.setInput(baseRow[i].value) // Otherwise carry over info
    })

    await sleep(1000) // Wait for the ElectrodeGroup table to update properly

    form.requestUpdate() // Re-render the form to update the Electrodes table

    // Validate that the new structure is correct
    const hasErrors = await form.validate().then(() => false).catch((e) => true)

    expect(hasErrors).toBe(false) // Is valid
})
