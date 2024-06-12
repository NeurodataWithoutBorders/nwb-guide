import { getEditableItems } from "../../../JSONSchemaInput.js";
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

export const getInfoFromId = (key) => {
    let [subject, session] = key.split("/");
    if (subject.startsWith("sub-")) subject = subject.slice(4);
    if (session.startsWith("ses-")) session = session.slice(4);

    return { subject, session };
};

export function resolveGlobalOverrides(subject, globalState, resolveMultiSessionOverrides = true) {
    const subjectMetadataCopy = { ...(globalState.subjects?.[subject] ?? {}) };
    delete subjectMetadataCopy.sessions; // Remove extra key from metadata

    if (resolveMultiSessionOverrides) {
        const overrides = structuredClone(globalState.project ?? {}); // Copy project-wide metadata

        merge(subjectMetadataCopy, overrides.Subject ?? (overrides.Subject = {})); // Ensure Subject exists

        return overrides;
    }

    return { Subject: subjectMetadataCopy };
}

const isPatternResult = Symbol("ispatternresult");

export function resolveFromPath(path, target) {
    return path.reduce((acc, key) => {
        if (!acc) return;
        if (acc[isPatternResult]) return acc;
        if (key in acc) return acc[key];
        else {
            const items = getEditableItems(acc, true, { name: key });
            const object = items.reduce((acc, { key, value }) => (acc[key] = value), {});
            object[isPatternResult] = true;
            return object;
        }
    }, target);
}

export function drillSchemaProperties(schema = {}, callback, target, path = [], inPatternProperties = false) {
    const properties = schema.properties ?? {};

    const patternProperties = schema.patternProperties ?? {};

    for (let regexp in patternProperties) {
        const info = patternProperties[regexp];
        const updatedPath = [...path, regexp];
        callback(updatedPath, info, undefined, true);
        drillSchemaProperties(info, callback, undefined, updatedPath, true, schema);
    }

    for (let name in properties) {
        const info = properties[name];

        if (name === "definitions") continue;

        const updatedPath = [...path, name];

        callback(updatedPath, info, target, undefined, schema);

        drillSchemaProperties(info, callback, target?.[name], updatedPath, inPatternProperties);
    }

    return schema;
}

export function resolveProperties(properties = {}, target, globals = {}) {
    if ("properties" in properties && "type" in properties) properties = properties.properties; // Correct for when a schema is passed instead

    for (let name in properties) {
        const info = properties[name];

        const props = info.properties;

        if (!(name in target)) {
            if (target.__disabled?.[name]) continue; // Skip disabled properties

            if (props) target[name] = {}; // Regisiter new interfaces in results
            // if (info.type === "array") target[name] = []; // Auto-populate arrays (NOTE: Breaks PyNWB when adding to TwoPhotonSeries field...)

            // Apply global or default value if empty
            if (name in globals) target[name] = globals[name];
            else if (info.default) target[name] = info.default;
        }

        if (target[name]) resolveProperties(props, target[name], globals[name]);
    }

    return target;
}

// Explicitly resolve the results for a particular session (from both GUIDE-defined globals and the NWB Schema)
export function resolveMetadata(subject, session, globalState) {
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
