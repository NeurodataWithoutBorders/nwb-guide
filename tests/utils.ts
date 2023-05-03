export function createMockGlobalState() {

    const globalState = {
        project: {
            name: "test",
            NWBFile: {
                lab: "My Lab",
            },
            Subject: {
                species: "Mus musculus",
                sex: 'U', // Required
            },
        },
        subjects: {
            subject_id: {
                subject_id: 'subject_id', // Is always brought down here...
                sessions: Array.from({length: 10}, (e, i) => `00${i}`)
            },
        },
        results: {
            subject_id: {
                session_id: {
                    metadata: {
                        NWBFile: {
                            session_start_time: (new Date()).toISOString(), // Required
                        }
                    },
                    source_data: {},
                },
            },
        },
    }

    return globalState
}
