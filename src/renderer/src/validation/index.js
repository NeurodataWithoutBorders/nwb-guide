import { baseUrl } from "../globals";
import validationSchema from "./validation"

// NOTE: Only validation missing on NWBFile Metadata is check_subject_exists and check_processing_module_name

export async function validateOnChange (name, parent, path, value) {
    let functions = [];

    const fullPath = [...path, name];

    const copy = { ...parent } // Validate on a copy of the parent
    if (arguments.length > 3) copy[name] = value // Update value on copy


    let lastResolved;
    functions = fullPath.reduce((acc, key, i) => {
        if (acc && key in acc) return (lastResolved = acc[key]);
        else return;
    }, validationSchema); // Pass the top level until it runs out

    // Skip wildcard check for categories marked with false
    if (lastResolved !== false && (functions === undefined || functions === true)) {
        let overridden = false
        let lastWildcard;
        fullPath.reduce((acc, key) => {
            if (acc && "*" in acc) {
                if (!acc["*"]) overridden = true // Disable if undefined
                else lastWildcard = acc["*"].replace(`{*}`, `${name}`)
            }
            return acc?.[key];
        }, validationSchema);

        if (overridden && functions !== true) lastWildcard = false // Disable if not promised to exist
        if (lastWildcard) functions = [lastWildcard];
    }

    if (!functions || (Array.isArray(functions) && functions.length === 0)) return; // No validation for this field
    if (!Array.isArray(functions)) functions = [functions];


    // Validate multiple conditions. May be able to offload this to a single server-side call
    const res = (
        await Promise.all(
            functions.map(async (func) => {
                if (typeof func === 'function') {
                    return await func(name, copy, path, this.results) // Can specify alternative client-side validation
                } else return await fetch(`${baseUrl}/neuroconv/validate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        parent: copy,
                        function_name: func,
                    }),
                })
                .then((res) => res.json());
            })
        )
    ).flat();

    if (res.find((res) => res))
        return res
            .filter((res) => res)
            .map((o) => {
                return {
                    message: o.message,
                    type: o.type ?? o.importance === "CRITICAL" ? "error" : "warning",
                    missing: o.missing ?? o.message.includes("is missing"), // Indicates that the field is missing
                };
            }); // Some of the requests end in errors

    return true;
};


export function checkStatus (warnings, errors, items = []) {
    let newStatus = "valid";
    const nestedStatus = items.map((f) => f.status);
    if (nestedStatus.includes("error")) newStatus = "error";
    else if (errors) newStatus = "error";
    else if (nestedStatus.includes("warning")) newStatus = "warning";
    else if (warnings) newStatus = "warning";

    if (newStatus !== this.status) this.onStatusChange((this.status = newStatus));
  };
