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

export function merge(path, toMerge = {}, target = this.info.globalState) {
    // Provide a temporary data structure to merge into
    const isTemp = !path || path.length === 0;
    if (isTemp) {
        path = ["temp"];
        target = { temp: target };
    }

    if (!Array.isArray(path)) path = path.split(".");

    const key = path.pop(); // Focus on the last key in the path
    path.forEach((key) => (target = target[key]));

    // Deep merge objects
    if (key in target) {
        for (const [k, v] of Object.entries(toMerge)) {
            if (typeof v === "object" && !Array.isArray(v)) {
                if (!target[key][k]) target[key][k] = { ...v }; // Copy objects
                else this.merge(`${k}`, v, target[key]);
            } else target[key][k] = v;
        }
    } else target[key] = toMerge;

    return isTemp ? target.temp : target;
}

export function mapSessions(callback = (v) => v, globalState) {
    return Object.entries(globalState.results)
        .map(([subject, sessions]) => {
            return Object.entries(sessions).map(([session, info]) => callback({ subject, session, info }));
        })
        .flat(2);
}
