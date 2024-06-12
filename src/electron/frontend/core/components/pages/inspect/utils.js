export function download(name, toSave) {
    const saveType = typeof toSave === "string" ? "text/plain" : "application/json";
    const text = typeof toSave === "string" ? toSave : JSON.stringify(toSave, null, 2);
    const blob = new Blob([text], { type: saveType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}
