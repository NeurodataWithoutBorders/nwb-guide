export function download(
    name: string,
    body: string | object
) {
    const saveType = typeof body === "string" ? "text/plain" : "application/json";
    const text = typeof body === "string" ? body : JSON.stringify(body, null, 2);
    const blob = new Blob([text], { type: saveType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}
