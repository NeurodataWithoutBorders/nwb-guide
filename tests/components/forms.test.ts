import { JSONSchemaForm } from '../../src/electron/frontend/core/components/JSONSchemaForm';
import { describe, it, expect } from 'vitest';

import { validateOnChange } from "../../src/electron/frontend/core/validation/index.js";
import { SimpleTable } from '../../src/electron/frontend/core/components/SimpleTable'

import baseMetadataSchema from '../../src/schemas/base-metadata.schema'

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const NWBFileSchemaProperties = baseMetadataSchema.properties.NWBFile.properties

// Helper function to mount the component
async function mountComponent(props) {

    const form = new JSONSchemaForm(props);

    document.body.append(form)
    await form.rendered
    // await form.updateComplete;

    return form;
}

describe('JSONSchemaForm', () => {
    it('renders text input correctly', async () => {

        const defaultValue = 'John Doe';
        const schema = {
            properties: {
                name: { type: 'string', title: 'Name', default: defaultValue },
            },
        };

        const form = await mountComponent({ schema });
        await form.rendered
        const nameInput = form.getFormElement('name');
        expect(nameInput).toBeDefined();
        expect(nameInput.value).toBe(defaultValue);
        expect(form.resolved.name).toBe(defaultValue);
        await nameInput.updateData('Jane Doe');
        expect(form.resolved.name).toBe('Jane Doe');
    });

    it('renders number input correctly', async () => {
        const schema = {
            properties: {
                age: { type: 'number', title: 'Age' },
            },
        };

        const form = await mountComponent({ schema });
        const ageInput = form.getFormElement('age');
        expect(ageInput).toBeDefined();
        await ageInput.updateData(30);
        expect(form.resolved.age).toBe(30);
    });

    it('renders boolean input correctly', async () => {
        const schema = {
            properties: {
                active: { type: 'boolean', title: 'Active' },
            },
        };

        const form = await mountComponent({ schema });
        const activeInput = form.getFormElement('active');
        expect(activeInput).toBeDefined();
        await activeInput.updateData(true);
        expect(form.resolved.active).toBe(true);
    });


    it('renders array input correctly', async () => {
        const schema = {
            properties: {
                hobbies: {
                    type: 'array',
                    title: 'Hobbies',
                    items: { type: 'string' },
                },
            },
        };

        const form = await mountComponent({ schema });
        const hobbies = form.getFormElement('hobbies');
        expect(hobbies).toBeDefined();
        expect(hobbies.value).toBeUndefined();
        await hobbies.updateData(['Reading']);
        expect(form.resolved.hobbies).toEqual(['Reading']);
    });

    it('renders object input correctly', async () => {
        const schema = {
            properties: {
                address: {
                    type: 'object',
                    title: 'Address',
                    properties: {
                        street: { type: 'string', title: 'Street' },
                        city: { type: 'string', title: 'City' },
                        zip: { type: 'string', title: 'ZIP Code' },
                    },
                },
            },
        };

        const form = await mountComponent({ schema });
        const streetInput = form.getFormElement(['address', 'street']);
        expect(streetInput).toBeDefined();
        await streetInput.updateData('123 Main St');
        expect(form.resolved.address.street).toBe('123 Main St');
    });

    it('renders enum input correctly', async () => {
        const schema = {
            properties: {
                status: {
                    type: 'string',
                    title: 'Status',
                    enum: ['Active', 'Inactive', 'Pending'],
                },
            },
        };

        const form = await mountComponent({ schema });
        const input = form.getFormElement('status');
        expect(input).toBeDefined();
        await input.updateData('Inactive');
        expect(form.resolved.status).toBe('Inactive');
    });

    it("renders tables correctly", async () => {
        const schema = {
            properties: {
                users: {
                    type: 'array',
                    title: 'Users',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', title: 'Name' },
                            age: { type: 'number', title: 'Age' },
                        },
                    },
                },
            },
        };

        const form = await mountComponent({
            schema,
            renderTable: (name, metadata, path) => {
                if (name !== "Electrodes") return new SimpleTable(metadata);
                else return true
            },
        });

        const users = form.getFormElement('users');
        expect(users).toBeDefined();
        await users.addRow();
        expect(users.data).toHaveLength(1);

        const row = users.getRow(0)
        const newData = { name: 'John Doe', age: 30 }
        Object.entries(newData).map(([key, value]) => {
            const cell = row.find(cell => cell.simpleTableInfo.col === key)
            return cell.setInput(value)
        })

        await sleep(100) // Wait for updates to register on the table

        expect(form.resolved.users).toEqual([{ name: 'John Doe', age: 30 }]);
    })

    it('validates form correctly', async () => {
        const schema = {
            properties: {
                name: { type: 'string', title: 'Name' },
            },
            required: ['name'],
        };

        const form = await mountComponent({ schema });
        const nameInput = form.getFormElement('name');
        expect(nameInput).toBeDefined();

        let errors = false;
        await form.validate().catch(() => errors = true);
        expect(errors).toBe(true);

        await nameInput.updateData('John Doe');

        await form.validate()
            .then(() => errors = false)
            .catch(() => errors = true);

        expect(errors).toBe(false);
        expect(form.resolved.name).toBe('John Doe');

    });

    // Pop-up inputs and forms work correctly
    it('creates a pop-up that submits properly', async () => {

        // Create the form
        const form = new JSONSchemaForm({
            schema: {
                "type": "object",
                "required": ["keywords", "experimenter"],
                "properties": {
                    "keywords": NWBFileSchemaProperties.keywords,
                    "experimenter": NWBFileSchemaProperties.experimenter
                }
            },
        })

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

        await experimenterNestedElement.updateData(['first_name'], 'Garrett')
        await experimenterNestedElement.updateData(['last_name'], 'Flynn')

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
    it('triggers and resolves inter-table updates correctly', async () => {

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

        await form.rendered // Wait for the form to re-render and validate properly

        // Validate that the new structure is correct
        const hasErrors = await form.validate().then(() => false).catch((e) => true)

        expect(hasErrors).toBe(false) // Is valid

    })



});
