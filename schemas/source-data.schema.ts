
import interfaceInfo from './interfaces.info'

export default function preprocessSourceDataSchema (schema) {

    const interfaces = Object.values(interfaceInfo.interfaces).reduce((acc, { name, ...rest }) => {
        acc[name] = rest
        return acc
    }, {})

    // Abstract across different interfaces
    Object.entries(schema.properties ?? {}).forEach(([key, schema]: [string, any]) => {

            const info = interfaces[key] ?? {}

            const files = schema.properties.file_paths ?? schema.properties.file_path
            const singleLocationInfo = schema.properties.file_path ?? schema.properties.folder_path

            if (schema.properties.file_paths) {
                Object.assign(schema.properties.file_paths, {
                    items: { type: 'string' },
                    description: '<b>Only one file supported at this time.</b> Multiple file support coming soon.',
                    maxItems: 1,
                })
            }

            else if (singleLocationInfo) {

                if (!singleLocationInfo.description && info.suffixes) singleLocationInfo.description = `<b>Suffixes:</b> ${info.suffixes.join(', ')}`

            }

            if (files) {
                const base = singleLocationInfo ? files : files.items
                if (!base.accept && info.suffixes) base.accept = info.suffixes
            }

            // Do not show steps
            if (schema.properties.gain) schema.properties.gain.step = null

            // Add description to exclude_cluster_groups
            if (schema.properties.exclude_cluster_groups) schema.properties.exclude_cluster_groups.description = 'Cluster groups to exclude (e.g. "noise" or ["noise", "mua"]).'

    })


    return schema
}
