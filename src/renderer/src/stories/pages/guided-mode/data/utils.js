import { merge } from "../../utils.js";

// Merge project-wide data into metadata
export function populateWithProjectMetadata(info, globalState) {
    const toMerge = Object.entries(globalState.project).filter(([_, value]) => value && typeof value === "object");
    toMerge.forEach(([key, value]) => {
        let internalMetadata = info[key];
        if (!info[key]) internalMetadata = info[key] = {};
        for (let key in value) {
            if (!(key in internalMetadata)) internalMetadata[key] = value[key]; // Prioritize existing results (cannot override with new information...)
        }
    });

    return info;
}

export function resolveGlobalOverrides(subject, globalState) {

    const subjectMetadataCopy = { ...globalState.subjects[subject] };
    delete subjectMetadataCopy.sessions; // Remove extra key from metadata

    const overrides = merge(undefined, globalState.project, {}); // Copy project-wide metadata
    merge("Subject", subjectMetadataCopy, overrides);
    
    return overrides
}

export function resolveProperties(properties = {}, target, globals = {}) {

    if ('properties' in properties && 'type' in properties) properties = properties.properties // Correct for when a schema is passed instead
    
    for (let name in properties) {
        const info = properties[name];
        const props = info.properties;

        if (!(name in target)) {
            if (props) target[name] = {}; // Regisiter new interfaces in results

            // Apply global or default value if empty
            if (name in globals) target[name] = globals[name];
            else if (info.default) target[name] = info.default;
        }

        resolveProperties(props, target[name], globals[name])
    }

    return target
}

// Explicitly resolve the results for a particular session (from both GUIDE-defined globals and the NWB Schema)
export function resolveResults(subject, session, globalState){
    const overrides = resolveGlobalOverrides(subject, globalState) // Unique per-subject (but not sessions)
    const metadata = globalState.results[subject][session].metadata
    const results = merge(undefined, metadata, {}) // Copy the metadata results from the form
    const schema = globalState.schema.metadata[subject][session];
    resolveProperties(schema, results, overrides) 
    return results
}

export function createResults({ subject, info }, globalState) {
    const results = populateWithProjectMetadata(info.metadata, globalState);
    const metadataCopy = { ...globalState.subjects[subject] };
    delete metadataCopy.sessions; // Remove extra key from metadata
    merge("Subject", metadataCopy, results);
    return results;
}
