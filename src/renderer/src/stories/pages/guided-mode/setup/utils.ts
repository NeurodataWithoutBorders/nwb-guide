
export const convertSubjectsToResults = (results: any, subjects: any, sourceDataObject = {}) => {

    const toRemove = Object.keys(results).filter((sub) => !Object.keys(subjects).includes(sub));
    for (let sub of toRemove) delete results[sub]; // Delete extra subjects from results

    for (let subject in subjects) {
        const { sessions = [] } = subjects[subject];
        let subObj = results[subject];

        if (!subObj) subObj = results[subject] = {};
        else {
            const toRemove = Object.keys(subObj).filter((s) => !sessions.includes(s));
            for (let s of toRemove) delete subObj[s]; // Delete extra sessions from results
            if (!sessions.length && !Object.keys(subObj).length) delete results[subject]; // Delete subjects without sessions
        }

        for (let session of sessions) {
            if (!(session in subObj))
                subObj[session] = {
                    source_data: { ...sourceDataObject },
                    metadata: {
                        NWBFile: { session_id: session },
                        Subject: { subject_id: subject },
                    },
                };
        }
    }

    return results

}