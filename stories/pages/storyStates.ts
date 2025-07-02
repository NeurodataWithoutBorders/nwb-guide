import nwbBaseSchema from "../../src/schemas/base-metadata.schema.js";
// import exephysExampleSchema from "../../../../../../schemas/json/ecephys_metadata_schema_example.json";

import { dashboard } from "../../src/electron/frontend/core/pages.js";
import { activateServer } from "../../src/electron/frontend/core/server/globals.js";

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
        workflow: {
            multiple_sessions: true,
            locate_data: true,
            base_directory: "path/to/data",
            upload_to_dandi: true,
        }
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
                            format: "file-path",
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
