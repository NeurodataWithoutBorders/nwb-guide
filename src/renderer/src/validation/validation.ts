import schema from './validation.json'
import { JSONSchemaForm } from '../stories/JSONSchemaForm.js'

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
    '*': function (this: JSONSchemaForm, name, parent, path) {
        if (name === 'name' && !(parent[name] in this.schema.properties.Ecephys.properties.Electrodes.items.properties)) {

            const linkedPath = ['Ecephys', 'Electrodes']
            const element = this.shadowRoot.getElementById(linkedPath[0]) // Accordion
                .shadowRoot.querySelector('nwb-jsonschema-form') // Nested form
                .shadowRoot.getElementById(linkedPath.join('-')) // Encapsulating container
                .children[1] // Nested table element


            element.schema.properties[parent[name]] = {} // Ensure property is present in the schema now
            element.data.forEach(o => o[parent[name]] = '') // Set column value as blank on all rows

            element.requestUpdate(); // Re-render table to show new column
        }
        return true
    }
}

// Label columns as invalid if not registered on the ElectrodeColumns table
// NOTE: If not present in the schema, these are not being rendered...
schema.Ecephys.Electrodes = {
    '*': function (this: JSONSchemaForm, name, parent, path) {
        if (!this.results.Ecephys.ElectrodeColumns.find((o: any) => o.name === name)) return [
            {
                message: 'Not a valid column',
                type: 'error'
            }
        ]
    }
}


export default schema
