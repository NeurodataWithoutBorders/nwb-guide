import schema from './validation.json'
import { JSONSchemaForm } from '../stories/JSONSchemaForm.js'
import Swal from 'sweetalert2'

function rerenderTable (this: JSONSchemaForm, linkedPath: string[]) {
    const element = this.getFormElement(linkedPath)
    if (element) element.requestUpdate() // Re-render table to show updates
    // if (element) setTimeout(() => {
    //     element.requestUpdate()
    // }, 100); // Re-render table to show new column
    return element
}

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

// NOTE: Does this maintain separation between multiple sessions?
schema.Ecephys.ElectrodeGroup = {
    ["*"]: {
        name: function (this: JSONSchemaForm, _, __, ___, value) {
            const groups = this.results.Ecephys.ElectrodeGroup.map(o => o.name)
        
                // Check if the latest value will be new. Run function after validation
            if (!value || !groups.includes(value)) {
                return () => {
                        setTimeout(() => rerenderTable.call(this, ['Ecephys', 'Electrodes'])) // Allow for the updates to occur
                }
            }
        },
        
        device: function (this: JSONSchemaForm, name, parent, path) {
            const devices = this.results.Ecephys.Device.map(o => o.name)
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

schema.Ecephys.Electrodes = {
    ["*"]:{

        // Label columns as invalid if not registered on the ElectrodeColumns table
        // NOTE: If not present in the schema, these are not being rendered...
        ['*']: function (this: JSONSchemaForm, name, parent, path) {
            if (!this.results.Ecephys.ElectrodeColumns.find((o: any) => o.name === name)) return [
                {
                    message: 'Not a valid column',
                    type: 'error'
                }
            ]
        },

        group_name: function (this: JSONSchemaForm, _, __, ___, value) {

            const groups = this.results.Ecephys.ElectrodeGroup.map(o => o.name)
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
    }
}


// Update the columns available on the Electrodes table when there is a new name in the ElectrodeColumns table
schema.Ecephys.ElectrodeColumns = {
    ['*']: {
        ['*']: function (this: JSONSchemaForm, prop, parent, path) {

            const name = parent['name']
            if (!name) return true // Allow blank rows
    
            if (prop === 'name' && !(name in this.schema.properties.Ecephys.properties.Electrodes.items.properties)) {
                const element = rerenderTable.call(this, ['Ecephys', 'Electrodes'])
                element.schema.properties[name] = {} // Ensure property is present in the schema now
                element.data.forEach(o => name in o ? undefined : o[name] = '') // Set column value as blank if not existent on row
            }
    
            this.schema.properties.Ecephys.properties.Electrodes.items.properties[name][prop] = parent[prop] // Update the actual schema for this (e.g. to update visible descriptions)
            return true
        }
    }
}

function ensureUnique(this: JSONSchemaForm, name, parent, path, value) {
    const {
        values,
        value: row
    } = get(this.results, path)

    if (!row) return true // Allow blank rows

    const rows = values.slice(-1)[0]
    const idx = path.slice(-1)[0]
    const isUniqueError = isNotUnique(name, value, rows, idx)
    if (isUniqueError) return isUniqueError

    return true
}

schema.Ophys = {
    ['*']: {
        '**': {
            ['name']: ensureUnique,
        }
    }
}

// Ophys
schema.Ophys.Device = {
    ["*"]: {

        ['name']: async function (this: JSONSchemaForm, name, parent, path, value) {

            const {
                values,
                value: row
            } = get(this.results, path)
    
            console.log('row', values, row)
    
            if (!row) return true // Allow blank rows
    
            const rows = values.slice(-1)[0]
            const idx = path.slice(-1)[0]
            const isUniqueError = isNotUnique(name, value, rows, idx)
            if (isUniqueError) return isUniqueError
    
            const prevValue = row[name]
    
            if (prevValue === value || prevValue === undefined) return true // No change
    
            const prevUniqueError = isNotUnique(name, prevValue, rows, idx)
            if (prevUniqueError) return true // Register as valid
    
            const result = await Swal.fire({
                title: `Are you sure you want to rename the ${prevValue} device?`,
                icon: "warning",
                text: `We will attempt to auto-update your Ophys devices to reflect this.`,
                heightAuto: false,
                backdrop: "rgba(0,0,0, 0.4)",
                confirmButtonText: "I understand",
                showConfirmButton: true,
                showCancelButton: true,
                cancelButtonText: "Cancel"
            })
    
            if (!result.isConfirmed) return null
    
            // Update Dependent Tables
            const dependencies = [
                ['Ophys', 'ImagingPlane'],
                ['Ophys', 'OnePhotonSeries'],
                ['Ophys', 'TwoPhotonSeries']
            ]
    
            dependencies.forEach(path => {
                const table = this.getFormElement(path)
                if (table) {
                    const data = table.data
                    data.forEach(row => {
                        if (row.device === prevValue) row.device = value
                    })
                    table.data = data
                }
    
                rerenderTable.call(this, path)
            })
    
            return true
        }

    }
}

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
