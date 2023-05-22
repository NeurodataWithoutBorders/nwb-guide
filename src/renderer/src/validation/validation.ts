import schema from './validation.json'
import { JSONSchemaForm } from '../stories/JSONSchemaForm.js'
import { getTableFromForm } from '../stories/forms/utils'

function rerender (this: JSONSchemaForm, linkedPath: string[]) {
    const element = getTableFromForm(this, linkedPath)
    if (element) setTimeout(() => element.requestUpdate(), 100); // Re-render table to show new column
}

// Specify JavaScript-side validation
schema.Ecephys.ElectrodeGroup.device = function (this: JSONSchemaForm, name, parent, path) {
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

let registeredGroups: {[x:string]: string[]} = {};

schema.Ecephys.ElectrodeGroup.name = function(this: JSONSchemaForm, name, parent, path) {
    const id = path.join('.')

    let groups = registeredGroups[id]
    if (!groups) groups = registeredGroups[id] = []

    const currentGroups = this.results.Ecephys.ElectrodeGroup.map(o => o.name)

    if (JSON.stringify(groups) !== JSON.stringify(currentGroups)) {
        registeredGroups[id] = currentGroups
        rerender.call(this, ['Ecephys', 'Electrodes'])
    }
}

schema.Ecephys.Electrodes.group_name = function (this: JSONSchemaForm, name, parent, path) {

    const groups = this.results.Ecephys.ElectrodeGroup.map(o => o.name)

    if (groups.includes(parent[name])) return true
    else {
        return [
            {
                message: 'Not a valid group name',
                type: 'error'
            }
        ]
    }
}


// Update the columns available on the Electrodes table when there is a new name in the ElectrodeColumns table
schema.Ecephys.ElectrodeColumns = {
    '*': function (this: JSONSchemaForm, prop, parent, path) {

        const name = parent['name']

        if (prop === 'name' && !(name in this.schema.properties.Ecephys.properties.Electrodes.items.properties)) {

            const element = rerender.call(this, ['Ecephys', 'Electrodes'])

            element.schema.properties[name] = {} // Ensure property is present in the schema now
            element.data.forEach(o => name in o ? undefined : o[name] = '') // Set column value as blank if not existent on row
        }

        this.schema.properties.Ecephys.properties.Electrodes.items.properties[name][prop] = parent[prop] // Update the actual schema for this (e.g. to update visible descriptions)
        return true
    }
}

// Label columns as invalid if not registered on the ElectrodeColumns table
// NOTE: If not present in the schema, these are not being rendered...
schema.Ecephys.Electrodes["*"] = function (this: JSONSchemaForm, name, parent, path) {
    if (!this.results.Ecephys.ElectrodeColumns.find((o: any) => o.name === name)) return [
        {
            message: 'Not a valid column',
            type: 'error'
        }
    ]
}

export default schema
