// import { merge } from "../src/renderer/src/stories/pages/utils"

export default function preprocessSourceDataSchema (schema) {
    
    // Abstract across different interfaces
    Object.values(schema.properties ?? {}).forEach((schema: any) => {

            // Do not show steps
            if (schema.properties.gain) schema.properties.gain.step = null

            // Add description to exclude_cluster_groups
            if (schema.properties.exclude_cluster_groups) schema.properties.exclude_cluster_groups.description = 'Cluster groups to exclude (e.g. "noise" or ["noise", "mua"]).'

    })


    return schema
}
