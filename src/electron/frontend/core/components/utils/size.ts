export function humanReadableBytes(size: number | string) {

    // Define the units
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    // Initialize the index to 0
    let index = 0;

    // Convert the size to a floating point number
    size = parseFloat(size);

    // Loop until the size is less than 1024 and increment the unit
    while (size >= 1000 && index < units.length - 1) {
        size /= 1000;
        index += 1;
    }

    // Return the size formatted with 2 decimal places and the appropriate unit
    return `${size.toFixed(2)} ${units[index]}`;
}
