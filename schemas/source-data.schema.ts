// import { merge } from "../src/renderer/src/stories/pages/utils"

export default function preprocessSourceDataSchema (schema) {

    // Abstract across different interfaces
    Object.entries(schema.properties ?? {}).forEach(([key, schema]: [string, any]) => {

            if (schema.properties.file_paths) {
                Object.assign(schema.properties.file_paths, {
                    items: { type: 'string' },
                    description: '<b>Only one file supported at this time.</b> Multiple file support coming soon.',
                    maxItems: 1,
                })
            }

            // Do not show steps
            if (schema.properties.gain) schema.properties.gain.step = null

            // Add description to exclude_cluster_groups
            if (schema.properties.exclude_cluster_groups) schema.properties.exclude_cluster_groups.description = 'Cluster groups to exclude (e.g. "noise" or ["noise", "mua"]).'

    })


    return schema
}
