import nwbBaseSchema from "../../src/schemas/base-metadata.schema.js";
// import exephysExampleSchema from "../../../../../../schemas/json/ecephys_metadata_schema_example.json";

import { dashboard } from "../../src/electron/renderer/src/pages.js";
import { activateServer } from "../../src/electron/renderer/src/server/globals.js";

activateServer();

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
