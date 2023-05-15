import schema from './validation.json'

// Specify JavaScript-side validation
schema.Ecephys.ElectrodeGroup.device = (name, parent, path, baseResult) => {
    const devices = baseResult.Ecephys.Device.map(o => o.name)
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

schema.Ecephys.Electrodes.group_name = (name, parent, path, baseResult) => {
    const groups = baseResult.Ecephys.ElectrodeGroup.map(o => o.name)
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

export default schema
