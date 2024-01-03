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

export const isPrivate = (k) => k.slice(0, 2) === "__";

export const sanitize = (o, condition = isPrivate) => {
    if (isObject(o)) {
        for (const [k, value] of Object.entries(o)) {
            if (condition(k, value)) delete o[k];
            else sanitize(value, condition);
        }
    }

    return o;
};

export function merge(toMerge = {}, target = {}, mergeOptions = {}) {
    // Deep merge objects
    for (const [k, value] of Object.entries(toMerge)) {
        const targetValue = target[k];
        // if (isPrivate(k)) continue;
        if (mergeOptions.arrays && Array.isArray(value) && Array.isArray(targetValue))
            target[k] = [...targetValue, ...value]; // Merge array entries together
        else if (value === undefined) {
            delete target[k]; // Remove matched values
            // if (mergeOptions.remove !== false) delete target[k]; // Remove matched values
        } else if (isObject(value)) {
            if (isObject(targetValue)) target[k] = merge(value, targetValue, mergeOptions);
            else {
                if (mergeOptions.clone) target[k] = merge(value, {}, mergeOptions); // Replace primitive values
                else target[k] = value; // Replace object values
            }
        } else target[k] = value; // Replace primitive values
    }

    return target;
}

export function mapSessions(callback = (value) => value, globalState) {
    return Object.entries(globalState.results)
        .map(([subject, sessions]) => {
            return Object.entries(sessions).map(([session, info], i) => callback({ subject, session, info }, i));
        })
        .flat(2);
}
