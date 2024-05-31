const prod = (arr: number[]) => arr.reduce((accumulator, currentValue) => accumulator * currentValue, 1);

export const getResourceUsage = (shape: number[], itemsize: number, scale=1e9) => prod(shape) * (itemsize / scale) // Default to GB
