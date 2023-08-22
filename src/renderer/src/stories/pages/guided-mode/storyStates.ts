import nwbBaseSchema from "../../../../../../schemas/base-metadata.schema";
// import exephysExampleSchema from "../../../../../../schemas/json/ecephys_metadata_schema_example.json";

import { dashboard } from "../../../pages.js";
export const PageTemplate = (args = {}) => {
    for (let k in args) dashboard[k] = args[k];
    return dashboard;
};


// nwbBaseSchema.properties.Ecephys = exephysExampleSchema;

export const globalState = {
    project: {
        name: "test",
        NWBFile: {
            lab: "My Lab",
        },
        Subject: {
            species: "Mus musculus",
        },
    },
    structure: {
        results: {},
        state: true
    },
    subjects: {
        subject_id: {},
    },
    results: {
        subject_id: {
            session_id: {
                metadata: {},
                source_data: {},
            },
        },
    },
    interfaces: {
        interface: "SpikeGLXRecordingInterface",
    },
    schema: {

        // Default source data schema
        source_data: {
            properties: {
                interface: {
                    type: "object",
                    properties: {
                        file_path: {
                            type: "string",
                            description: "Enter the path to the source data file.",
                            format: "file",
                        },
                    },
                    required: ["file_path"],
                },
            },
        },

        // Base metadata schema for one session
        metadata: {
            subject_id: {
                session_id: nwbBaseSchema,
            },
        },
    },
};
