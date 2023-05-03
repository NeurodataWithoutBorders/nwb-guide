import { merge } from "../../utils.js";

 // Merge project-wide data into metadata
export function populateWithProjectMetadata(info, globalState) {
    const toMerge = Object.entries(globalState.project).filter(
        ([_, value]) => value && typeof value === "object"
    );
    toMerge.forEach(([key, value]) => {
        let internalMetadata = info[key];
        if (!info[key]) internalMetadata = info[key] = {};
        for (let key in value) {
            if (!(key in internalMetadata)) internalMetadata[key] = value[key]; // Prioritize existing results (cannot override with new information...)
        }
    });

    return info;
}

export function createResults ({ subject, info }, globalState){
    const results = populateWithProjectMetadata(info.metadata, globalState);
    const metadataCopy = { ...globalState.subjects[subject] };
    delete metadataCopy.sessions; // Remove extra key from metadata
    merge("Subject", metadataCopy, results);
    return results
}