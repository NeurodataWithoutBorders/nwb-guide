import { isObject } from "./typecheck.js";

type Schema = { properties: Record<string, any> };

type ConditionFunction = (key: string, value: any) => boolean;

type Object = Record<string, any>;

type MergeOptions = {
    arrays?: "append" | "merge";
    clone?: boolean;
    remove?: boolean;
};

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

export function createResultsForSession({ subject, info }, globalState) {
    const results = populateWithProjectMetadata(info.metadata, globalState);
    const subjectGlobalsCopy = { ...globalState.subjects[subject] };
    delete subjectGlobalsCopy.sessions; // Remove extra key from metadata
    results.Subject = merge(subjectGlobalsCopy, results.Subject);
    return results;
}



export const updateResultsFromSubjects = (results: any, subjects: any, sourceDataObject = {}, nameMap: {[x:string]: string} = {}) => {

    const oldResults = structuredClone(results);

    const toRemove = Object.keys(results).filter((sub) => !Object.keys(subjects).includes(sub));
    for (let sub of toRemove) {
        if (sub in nameMap) results[nameMap[sub]] = results[sub];
        delete results[sub]; // Delete extra subjects from results
    }


    for (let subject in subjects) {
        const { sessions = [] } = subjects[subject];
        let subObj = results[subject];

        if (!subObj) subObj = results[subject] = {};
        else {
            const toRemove = Object.keys(subObj).filter((s) => !sessions.includes(s));
            for (let s of toRemove) {

                // Skip removal if your data has been mapped
                if (subject in nameMap) {
                    const oldSessionInfo = oldResults[subject]
                    const newSubResults = results[nameMap[subject]]
                    if (s in oldSessionInfo) newSubResults[s] = oldSessionInfo[s];
                }

                delete subObj[s]; // Delete extra sessions from results
            }
            if (!sessions.length && !Object.keys(subObj).length) delete results[subject]; // Delete subjects without sessions
        }

        for (let session of sessions) {
            if (!(session in subObj))
                subObj[session] = {
                    source_data: { ...sourceDataObject },
                    metadata: {
                        NWBFile: { session_id: session },
                        Subject: { subject_id: subject },
                    },
                };
        }
    }

    return results

}

export const setUndefinedIfNotDeclared = (
    schemaProps: Schema | Schema["properties"],
    resolved: Record<string, any> = {}
) => {

    const resolvedProps = "properties" in schemaProps ? schemaProps.properties : schemaProps;

    for (const prop in resolvedProps) {
        const propInfo = resolvedProps[prop]?.properties;
        if (propInfo) setUndefinedIfNotDeclared(propInfo, resolved[prop]);
        else if (!(prop in resolved)) resolved[prop] = undefined;
    }
};

const isPrivate = (k: string) => k.slice(0, 2) === "__";

export const sanitize = (
    item: any,
    condition: ConditionFunction = isPrivate
) => {
    if (isObject(item)) {
        for (const [k, value] of Object.entries(item)) {
            if (condition(k, value)) delete item[k];
            else sanitize(value, condition);
        }
    } else if (Array.isArray(item)) item.forEach((value) => sanitize(value, condition));

    return item;
};

export function merge(
    toMerge: Object = {},
    target: Object = {},
    mergeOptions: MergeOptions = {}
) {
    // Deep merge objects
    for (const [k, value] of Object.entries(toMerge)) {
        const targetValue = target[k];
        // if (isPrivate(k)) continue;
        const arrayMergeMethod = mergeOptions.arrays;
        if (arrayMergeMethod && Array.isArray(value) && Array.isArray(targetValue)) {
            if (arrayMergeMethod === "append")
                target[k] = [...targetValue, ...value]; // Append array entries together
            else {
                target[k] = targetValue.map((targetItem, i) => merge(value[i], targetItem, mergeOptions)); // Merge array entries
            }
        } else if (value === undefined) {
            delete target[k]; // Remove matched values
            // if (mergeOptions.remove !== false) delete target[k]; // Remove matched values
        } else if (isObject(value)) {
            if (isObject(targetValue)) target[k] = merge(value, targetValue, mergeOptions);
            else {
                if (mergeOptions.clone)
                    target[k] = merge(value, {}, mergeOptions); // Replace primitive values
                else target[k] = value; // Replace object values
            }
        } else target[k] = value; // Replace primitive values
    }

    return target;
}

export function mapSessions(callback = (value) => value, toIterate = {}) {
    return Object.entries(toIterate)
        .map(([subject, sessions]) => {
            return Object.entries(sessions).map(([session, info], i) => callback({ subject, session, info }, i));
        })
        .flat(2);
}


export const resolveAsJSONSchema = (
    schema: Schema,
    path: string[] = [],
    parent: { [x:string]: any } = structuredClone(schema)
) => {

    const copy = { ...schema }

    if (isObject(schema)) {

        const resolvedProps = copy // "properties" in copy ? copy.properties : copy;

        for (let propName in resolvedProps) {
            const prop = resolvedProps[propName];

            if (isObject(prop)) {
                const internalCopy = (resolvedProps[propName] = { ...prop });
                const refValue = internalCopy["$ref"]
                const allOfValue = internalCopy['allOf']

                if (allOfValue) {
                    resolvedProps[propName]= allOfValue.reduce((acc, curr) => {
                        const result = resolveAsJSONSchema({ _temp: curr}, path, parent)
                        const resolved = result._temp
                        return merge(resolved, acc)
                    }, {})
                }

                else if (refValue) {

                    const refPath = refValue.split('/').slice(1) // NOTE: Assume from base
                    const resolved = refPath.reduce((acc, key) => acc[key], parent)

                    if (resolved) resolvedProps[propName] = resolved;
                    else delete resolvedProps[propName]
                } 
                
                // Find refs on any level of an object
                else resolvedProps[propName] = resolveAsJSONSchema(internalCopy, [...path, propName], parent);
            }
        }

        return copy as { [x:string]: any }
    }

    return schema;
}
