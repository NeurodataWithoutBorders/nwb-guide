import { resolveAll } from "../promises";
import { baseUrl } from "../server/globals";
import validationSchema from "./validation";

// NOTE: Only validation missing on NWBFile Metadata is check_subject_exists and check_processing_module_name

export const isErrorImportance = ["PYNWB_VALIDATION", "CRITICAL", "ERROR"];
export function getMessageType(item) {
    return item.type ?? (isErrorImportance.includes(item.importance) ? "error" : "warning");
}

export async function validateOnChange(name, parent, path, value) {
    let functions = [];

    const fullPath = [...path, name];

    const fullPathNoRows = fullPath.filter((key) => typeof key !== "number");

    const copy = { ...parent }; // Validate on a copy of the parent
    if (arguments.length > 3) copy[name] = value; // Update value on copy

    let lastResolved;
    functions = fullPathNoRows.reduce((acc, key, i) => {
        if (acc && key in acc) return (lastResolved = acc[key]);
        else return;
    }, validationSchema); // Pass the top level until it runs out

    let overridden = false;

    // Skip wildcard check for categories marked with false
    if (lastResolved !== false && (functions === undefined || functions === true)) {
        // let overridden = false;
        let lastWildcard;
        fullPathNoRows.reduce((acc, key) => {

            if (acc && "*" in acc) {
                if (!acc["*"]&& lastWildcard)
                    overridden = true; // Disable if false and a wildcard has already been specified
                
                // Otherwise set the last wildcard
                else {
                    lastWildcard = typeof acc["*"] === "string" ? acc["*"].replace(`{*}`, `${name}`) : acc["*"];
                    overridden = false; // Re-enable if a new one is specified below
                }
            }
            return acc?.[key];
        }, validationSchema);

        if (overridden && functions !== true) lastWildcard = false; // Disable if not promised to exist
        if (lastWildcard) functions = [lastWildcard];
    }


    if (!functions || (Array.isArray(functions) && functions.length === 0)) return; // No validation for this field
    if (!Array.isArray(functions)) functions = [functions];

    // Validate multiple conditions. May be able to offload this to a single server-side call
    const results = functions.map((func) => {
        if (typeof func === "function") {
            return func.call(this, name, copy, path, value); // Can specify alternative client-side validation
        } else {
            return fetch(`${baseUrl}/neuroconv/validate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    parent: copy,
                    function_name: func,
                }),
            })
                .then((res) => res.json())
                .catch((e) => {}); // Let failed fetch succeed
        }
    });

    const res = resolveAll(results, (arr) => {

        const flat = arr.flat();
        if (flat.find((res) => res?.message)) {
            return flat
                .filter((res) => res?.message)
                .map((o) => {
                    return {
                        message: o.message,
                        type: getMessageType(o),
                        missing: o.missing ?? o.message.includes("is missing"), // Indicates that the field is missing
                    };
                }); // Some of the requests end in errors
        }

        if (flat.some((res) => res === null)) return null

        // Allow for providing one function to execute after data update
        const hasFunc = results.find((f) => typeof f === "function");
        if (hasFunc) return hasFunc;

        return true;
    });

    return res
}

export function checkStatus(warnings, errors, items = []) {
    let newStatus = "valid";
    const nestedStatus = items.map((f) => f.status);
    if (nestedStatus.includes("error")) newStatus = "error";
    else if (errors) newStatus = "error";
    else if (nestedStatus.includes("warning")) newStatus = "warning";
    else if (warnings) newStatus = "warning";
    if (this && this.onStatusChange && "status" in this && newStatus !== this.status)
        this.onStatusChange((this.status = newStatus)); // Automatically run callbacks if supported by the context
    return newStatus;
}
