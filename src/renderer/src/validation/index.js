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
    const toIterate = fullPath; //fullPathNoRows // fullPath

    const copy = { ...parent }; // Validate on a copy of the parent
    if (arguments.length > 3) copy[name] = value; // Update value on copy

    let lastResolved;
    functions = toIterate.reduce((acc, key, i) => {
        if (acc && key in acc) return (lastResolved = acc[key]);
        else return;
    }, validationSchema); // Pass the top level until it runs out

    let overridden = false;

    // Skip wildcard check for categories marked with false
    if (lastResolved !== false && (functions === undefined || functions === true)) {
        // let overridden = false;
        let lastWildcard;
        toIterate.reduce((acc, key) => {

            // Disable the value is a hardcoded list of functions + a wildcard has already been specified
            if (lastWildcard && Array.isArray(acc[key] ?? {})) overridden = true; 
                
            else if (acc && "*" in acc) {
                if (acc["*"] === false && lastWildcard)
                    overridden = true; // Disable if false and a wildcard has already been specified
                // Otherwise set the last wildcard
                else {
                    lastWildcard = typeof acc["*"] === "string" ? acc["*"].replace(`{*}`, `${name}`) : acc["*"];
                    overridden = false; // Re-enable if a new one is specified below
                }
            } else if (lastWildcard && typeof lastWildcard === "object") {
                const newWildcard = lastWildcard[key] ?? lastWildcard["*"] ?? lastWildcard["**"] ?? (acc && acc["**"]); // Drill wildcard objects once resolved
                // Prioritize continuation of last wildcard
                if (newWildcard) lastWildcard = newWildcard;
            }

            return acc?.[key];
        }, validationSchema);

        if (overridden && functions !== true) lastWildcard = false; // Disable if not promised to exist

        if (typeof lastWildcard === "function" || typeof lastWildcard === "string") functions = [lastWildcard];
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
                .catch(() => {}); // Let failed fetch succeed
        }
    });

    const res = resolveAll(results, (arr) => {
        arr = arr.map((v, i) => {
            const func = functions[i];
            if (typeof func === "function") return v;
            else return v === null ? undefined : v;
        });

        const flat = arr.flat();
        if (flat.find((res) => res?.message)) {
            return flat
                .filter((res) => res?.message)
                .map((messageInfo) => {
                    return {
                        message: messageInfo.message,
                        type: getMessageType(messageInfo),
                        missing: messageInfo.missing ?? messageInfo.message.includes("is missing"), // Indicates that the field is missing
                    };
                }); // Some of the requests end in errors
        }

        if (flat.some((res) => res === null)) return null;

        // Allow for providing one function to execute after data update
        const hasFunc = results.find((f) => typeof f === "function");
        if (hasFunc) return hasFunc;

        return true;
    });

    return res;
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
