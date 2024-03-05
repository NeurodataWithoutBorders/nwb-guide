import schema from './validation.json'
import { JSONSchemaForm } from '../stories/JSONSchemaForm.js'
import Swal from 'sweetalert2'

// ----------------- Validation Utility Functions ----------------- //

const isNotUnique = (key, currentValue, rows, idx) => {

    const array = Array.isArray(rows) ? rows : Object.values(rows)
    idx = Array.isArray(rows) ? idx : Object.keys(rows).indexOf(idx)

    const isUnique = array.filter((o, i) => o[key] === currentValue && i !== idx).length === 0

    if (!isUnique) return [
        {
            message: `Not a unique ${key}`,
            type: 'error'
        }
    ]
}

const get = (object: any, path: string[]) => {
    const values: any[] = []

    const name = path.slice(-1)[0]
    const finalValue = path.slice(0, -1).reduce((acc, str) => {
        values.push(acc[str])
        return acc[str]
    }, object)



    return {
        value: finalValue?.[name],
        values
    }
}



function ensureUnique(this: JSONSchemaForm, name, parent, path, value) {
    const {
        values,
        value: row
    } = get(this.results, path) // NOTE: this.results is out of sync with the actual row contents at the moment of validation


    if (!row) return true // Allow blank rows

    const rows = values.slice(-1)[0]
    const idx = path.slice(-1)[0]
    const isUniqueError = isNotUnique(name, value, rows, idx)
    if (isUniqueError) return isUniqueError

    return true
}


const getTablePathInfo = (path: string[]) => {
    const modality = path[0] as Modality
    const slice = path.slice(-2)
    const table = slice[1]
    const row = slice[2]

    return { modality, table, row }
}


// ----------------- Joint Ophys and Ecephys Validation ----------------- //

const dependencies = {
    Ophys: {
        devices: [
            {
                path: [ 'ImagingPlane' ],
                key: 'device'
            },
            {
                path: [ 'TwoPhotonSeries' ],
                key: 'imaging_plane'
            },
            {
                path: [ 'OnePhotonSeries' ],
                key: 'imaging_plane'
            }
        ]
    },
    Ecephys: {
        devices: [
            {
                path: [ 'ElectrodeGroup' ],
                key: 'device'
            }
        ],
        groups: [
            {
                path: [ 'Electrodes', '*', 'Electrodes' ],
                key: 'group_name'
            }
        ]
    }
}

type Modality = keyof typeof dependencies

schema.Ophys = schema.Ecephys = {
    ['*']: {
        '**': {
            ['name']: ensureUnique,
        }
    }
}

async function safeRename (this: JSONSchemaForm, name, parent, path, value, options = {}) {

    const {
        dependencies = {},
        swalOptions = {}
    } = options

    const {
        values,
        value: row
    } = get(this.results, path)

    const info = getTablePathInfo(path)

    if (!row) return true // Allow blank rows

    const rows = values.slice(-1)[0]
    const idx = path.slice(-1)[0]
    const isUniqueError = isNotUnique(name, value, rows, idx)
    if (isUniqueError) return isUniqueError

    const prevValue = row[name]

    if (prevValue === value || prevValue === undefined) return true // No change

    const prevUniqueError = isNotUnique(name, prevValue, rows, idx)
    if (prevUniqueError) return true // Register as valid

    const resolvedSwalOptions = {}
    for (const key in swalOptions) resolvedSwalOptions[key] = typeof swalOptions[key] === 'function' ? swalOptions[key](value, prevValue) : swalOptions[key]

    const result = await Swal.fire({
        ...resolvedSwalOptions,
        icon: "warning",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "I understand",
        showConfirmButton: true,
        showCancelButton: true,
        cancelButtonText: "Cancel"
    })

    if (!result.isConfirmed) return null

    // Update Dependent Tables
    const modalityDependencies = dependencies[info.modality] ?? []

    modalityDependencies.forEach(({ key, path }) => {
        const fullPath = [info.modality, ...path]
        const tables = this.getAllFormElements(fullPath, { tables: true })
        console.log('Got all tables', tables, fullPath)
        tables.forEach(table => {
            const data = table.data
            data.forEach(row => {
                if (row[key] === prevValue) row[key] = value
            })
            table.data = data
            table.requestUpdate()
        })
    })

    return true
}

// Ophys
schema.Ophys.Device = schema.Ecephys.Device = {
    ["*"]: {

        ['name']: function(...args) {
            return safeRename.call(this, ...args, {
                dependencies: { Ophys: dependencies.Ophys.devices, Ecephys: dependencies.Ecephys.devices },
                swalOptions: {
                    title: (current, prev) => `Are you sure you want to rename the ${prev} device?`,
                    text: () => `We will attempt to auto-update your Ophys devices to reflect this.`,
                }
            })
        },

    }
}

// ----------------- Ecephys Validation ----------------- //

// NOTE: Does this maintain separation between multiple sessions?
schema.Ecephys.ElectrodeGroup = {
    ["*"]: {

        name: function(...args) {
            return safeRename.call(this, ...args, {
                dependencies: { Ecephys: dependencies.Ecephys.groups },
                swalOptions: {
                    title: (current, prev) => `Are you sure you want to rename the ${prev} group?`,
                    text: () => `We will attempt to auto-update your electrode groups to reflect this.`,
                }
            })
        },

        device: function (this: JSONSchemaForm, name, parent, path, value) {
            const devices = this.results.Ecephys.Device.map(({ name }) => name)

            if (devices.includes(value)) return true
            else {
                return [
                    {
                        message: 'Not a valid device',
                        type: 'error'
                    }
                ]
            }
        }
    }
}


// Label columns as invalid if not registered on the ElectrodeColumns table
// NOTE: If not present in the schema, these are not being rendered...

schema.Ecephys.Electrodes = {

    // All interfaces
    ["*"]: {

        Electrodes: {

            // All other column
            ['*']: function (this: JSONSchemaForm, name, parent, path) {
                const electrodeColumns = this.results.ElectrodeColumns
                if (electrodeColumns && !electrodeColumns.find((row: any) => row.name === name)) return [
                    {
                        message: 'Not a valid column',
                        type: 'error'
                    }
                ]
            },

            // Group name column
            group_name: function (this: JSONSchemaForm, _, __, ___, value) {

                const groups = this.results.Ecephys.ElectrodeGroup.map(({ name }) => name)
                if (groups.includes(value)) return true
                else {
                    return [
                        {
                            message: 'Not a valid group name',
                            type: 'error'
                        }
                    ]
                }
            }
        },

        // Update the columns available on the Electrodes table when there is a new name in the ElectrodeColumns table
        ElectrodeColumns: {
            ['*']: {
                ['*']: function (this: JSONSchemaForm, prop, parent, path) {

                    const name = parent['name']
                    if (!name) return true // Allow blank rows

                    // NOTE: Reimplement across all separate tables...
                    // if (prop === 'name' && !(name in this.schema.properties.Ecephys.properties.Electrodes.items.properties)) {
                    //     const element = rerender.call(this, ['Ecephys', 'Electrodes'])
                    //     element.schema.properties[name] = {} // Ensure property is present in the schema now
                    //     element.data.forEach(row => name in row ? undefined : row[name] = '') // Set column value as blank if not existent on row
                    // }
                }
            }
        }
    }
}

// ----------------- Ophys Validation ----------------- //

schema.Ophys.ImagingPlane = {
    ["*"]: {
        device: function (this: JSONSchemaForm, name, parent, path, value) {
            const devices = this.results.Ophys.Device.map(o => o.name)
            if (devices.includes(parent[name])) return true
            else {
                return [
                    {
                        message: 'Not a valid device',
                        type: 'error'
                    }
                ]
            }
        }
    }
}


export default schema
