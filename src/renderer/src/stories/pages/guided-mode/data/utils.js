import { merge } from "../../utils.js";

// Merge project-wide data into metadata
export function populateWithProjectMetadata(info, globalState) {
    const copy = structuredClone(info);
    const toMerge = Object.entries(globalState.project).filter(([_, value]) => value && typeof value === "object");
    toMerge.forEach(([key, value]) => {
        let internalMetadata = copy[key];
        if (!copy[key]) internalMetadata = copy[key] = {};
        for (let key in value) {
            if (!(key in internalMetadata)) internalMetadata[key] = value[key]; // Prioritize existing results (cannot override with new information...)
        }
    });

    return copy;
}

export function resolveGlobalOverrides(subject, globalState) {
    const subjectMetadataCopy = { ...globalState.subjects[subject] };
    delete subjectMetadataCopy.sessions; // Remove extra key from metadata

    const overrides = structuredClone(globalState.project ?? {}); // Copy project-wide metadata
    merge(subjectMetadataCopy, overrides.Subject);

    return overrides;
}

export function resolveProperties(properties = {}, target, globals = {}) {
    if ("properties" in properties && "type" in properties) properties = properties.properties; // Correct for when a schema is passed instead

    for (let name in properties) {
        const info = properties[name];

        // NEUROCONV PATCH: Correct for incorrect array schema
        if (info.properties && info.type === "array") {
            info.items = { type: "object", properties: info.properties, required: info.required };
            delete info.properties;
        }

        const props = info.properties;

        if (!(name in target)) {
            if (props) target[name] = {}; // Regisiter new interfaces in results
            // if (info.type === "array") target[name] = []; // Auto-populate arrays (NOTE: Breaks PyNWB when adding to TwoPhotonSeries field...)

            // Apply global or default value if empty
            if (name in globals) target[name] = globals[name];
            else if (info.default) target[name] = info.default;
        }

        resolveProperties(props, target[name], globals[name]);
    }

    return target;
}

// Explicitly resolve the results for a particular session (from both GUIDE-defined globals and the NWB Schema)
export function resolveResults(subject, session, globalState) {
    const overrides = resolveGlobalOverrides(subject, globalState); // Unique per-subject (but not sessions)
    const metadata = globalState.results[subject][session].metadata;
    const results = structuredClone(metadata); // Copy the metadata results from the form
    const schema = globalState.schema.metadata[subject][session];
    resolveProperties(schema, results, overrides);
    return results;
}

export function createResults({ subject, info }, globalState) {
    const results = populateWithProjectMetadata(info.metadata, globalState);
    const subjectGlobalsCopy = { ...globalState.subjects[subject] };
    delete subjectGlobalsCopy.sessions; // Remove extra key from metadata
    merge(subjectGlobalsCopy, results.Subject);
    return results;
}
