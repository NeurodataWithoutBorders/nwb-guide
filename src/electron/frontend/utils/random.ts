const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const getRandomIndex = (count: number) => Math.floor(count * Math.random());

// return random string always of len characters
export const getRandomString = (len = 7) => {
    let result = "";
    for (let i = 0; i < len; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
}

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
