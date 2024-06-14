import { humanReadableBytes } from "../../utils/bytes";

const prod = (arr: number[]) => arr.reduce((accumulator, currentValue) => accumulator * currentValue, 1);

export const getResourceUsageBytes = (shape: number[], itemsize: number, scale=1e9) => prod(shape) * (itemsize / scale) // Default to GB

export const getResourceUsage = (shape: number[], itemsize: number) => humanReadableBytes(getResourceUsageBytes(shape, itemsize, 1))
