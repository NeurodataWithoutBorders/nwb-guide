// import { merge } from "../src/renderer/src/stories/pages/utils"

export default function getSourceDataSchema (schema) {
    // const copy = merge(schema, {})
    Object.values(schema.properties).forEach((schema: any) => {
        if (schema.properties.gain) schema.properties.gain.step = null // Do not show steps
    })

    return schema
}
