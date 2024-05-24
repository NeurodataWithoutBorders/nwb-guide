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

const isObject = (item) => {
    return item && typeof item === "object" && !Array.isArray(item);
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

export const sanitize = (item, condition = isPrivate) => {
    if (isObject(item)) {
        for (const [k, value] of Object.entries(item)) {
            if (condition(k, value)) delete item[k];
            else sanitize(value, condition);
        }
    }

    return item;
};

export function merge(toMerge = {}, target = {}, mergeOptions = {}) {
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
