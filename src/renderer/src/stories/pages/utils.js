export const randomizeIndex = (count) => Math.floor(count * Math.random());

export const randomizeElements = (array, count) => {
    if (count > array.length) throw new Error("Array size cannot be smaller than expected random numbers count.");
    const result = [];
    const guardian = new Set();
    while (result.length < count) {
        const index = randomizeIndex(array.length);
        if (guardian.has(index)) continue;
        const element = array[index];
        guardian.add(index);
        result.push(element);
    }
    return result;
};

const isObject = (o) => {
    return o && typeof o === "object" && !Array.isArray(o);
};

export const setUndefinedIfNotDeclared = (schemaProps, resolved) => {
    if ("properties" in schemaProps) schemaProps = schemaProps.properties;
    for (const prop in schemaProps) {
        const propInfo = schemaProps[prop]?.properties;
        if (propInfo) setUndefinedIfNotDeclared(propInfo, resolved[prop]);
        else if (!(prop in resolved)) resolved[prop] = undefined;
    }
};

export function merge(toMerge = {}, target = {}, mergeOpts = {}) {
    // Deep merge objects
    for (const [k, v] of Object.entries(toMerge)) {
        const targetV = target[k];
        if (mergeOpts.arrays && Array.isArray(v) && Array.isArray(targetV))
            target[k] = [...targetV, ...v]; // Merge array entries together
        else if (isObject(v) || isObject(targetV)) target[k] = merge(v, target[k], mergeOpts);
        else if (v === undefined) delete target[k]; // Remove matched values
        else target[k] = v; // Replace primitive values
    }

    return target;
}

export function mapSessions(callback = (v) => v, globalState) {
    return Object.entries(globalState.results)
        .map(([subject, sessions]) => {
            return Object.entries(sessions).map(([session, info]) => callback({ subject, session, info }));
        })
        .flat(2);
}
