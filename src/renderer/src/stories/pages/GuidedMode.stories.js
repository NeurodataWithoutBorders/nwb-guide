import { dashboard } from "../../pages.js";
import nwbBaseSchema from "../../../../../schemas/base-metadata.schema";
import exephysExampleSchema from "../../../../../schemas/json/ecephys_metadata_schema_example.json";

const options = Object.keys(dashboard.pagesById).filter((k) => k.includes("guided"));

export default {
    title: "Pages/Guided Mode",
    parameters: {
        chromatic: { disableSnapshot: false },
    },
    argTypes: {
        activePage: {
            options,
            control: { type: "select" },
        },
    },
};

nwbBaseSchema.properties.Ecephys = exephysExampleSchema

const globalState = {
    project: {
        name: "test",
        NWBFile: {
            lab: "My Lab",
        },
        Subject: {
            species: "Mus musculus",
        },
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
        neuropixel: "SpikeGLXRecordingInterface",
    },
    schema: {
        source_data: {
            properties: {
                neuropixel: {
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
        metadata: {
            subject_id: {
                session_id: nwbBaseSchema,
            },
        },
    },
};

const Template = (args = {}) => {
    for (let k in args) dashboard[k] = args[k];
    return dashboard;
};

export const Home = Template.bind({});
Home.args = {
    activePage: "guided",
};

export const Start = Template.bind({});
Start.args = {
    activePage: "guided/start",
};

export const NewDataset = Template.bind({});
NewDataset.args = {
    activePage: "guided/details",
};

export const Structure = Template.bind({});
Structure.args = {
    activePage: "guided/structure",
};

export const Locate = Template.bind({});
Locate.args = {
    activePage: "guided/locate",
};

export const Subjects = Template.bind({});
Subjects.args = {
    activePage: "guided/subjects",
};

export const SourceData = Template.bind({});
SourceData.args = {
    activePage: "guided/sourcedata",
};

export const Metadata = Template.bind({});
Metadata.args = {
    activePage: "guided/metadata",
};

export const ConversionOptions = Template.bind({});
ConversionOptions.args = {
    activePage: "guided/options",
};

export const StubPreview = Template.bind({});
StubPreview.args = {
    activePage: "guided/preview",
};

export const Upload = Template.bind({});
Upload.args = {
    activePage: "guided/upload",
};

export const Results = Template.bind({});
Results.args = {
    activePage: "guided/review",
};

const statefulPages = [
    Home,
    Start,
    NewDataset,
    Structure,
    Locate,
    Subjects,
    SourceData,
    Metadata,
    ConversionOptions,
    StubPreview,
    Upload,
    Results,
];

statefulPages.forEach((page) => (page.args.globalState = globalState));
