
export const getRandomIndex = (count: number) => Math.floor(count * Math.random());

export const getRandomString = () => Math.random().toString(36).substring(7);

export const getRandomSample = (
    array: any[],
    count: number
) => {
    if (count > array.length) throw new Error("Array size cannot be smaller than expected random numbers count.");
    const result = [];
    const guardian = new Set();
    while (result.length < count) {
        const index = getRandomIndex(array.length);
        if (guardian.has(index)) continue;
        const element = array[index];
        guardian.add(index);
        result.push(element);
    }
    return result;
};