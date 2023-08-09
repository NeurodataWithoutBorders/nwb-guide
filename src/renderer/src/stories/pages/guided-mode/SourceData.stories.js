import { globalState, PageTemplate } from "./storyStates";
import SpikeGLXRecordingInterfaceSchema from "../../../../../../schemas/json/generated/SpikeGLXRecordingInterface.json";
import SpikeGLXNIDQInterfaceSchema from "../../../../../../schemas/json/generated/SpikeGLXNIDQInterface.json";
import PhySortingInterfaceSchema from "../../../../../../schemas/json/generated/PhySortingInterface.json";
import NeuroScopeRecordingInterfaceSchema from "../../../../../../schemas/json/generated/NeuroScopeRecordingInterface.json";
import NeuroScopeLFPInterfaceSchema from "../../../../../../schemas/json/generated/NeuroScopeLFPInterface.json";
import NeuroScopeSortingInterfaceSchema from "../../../../../../schemas/json/generated/NeuroScopeSortingInterface.json";
import BiocamRecordingInterfaceSchema from "../../../../../../schemas/json/generated/BiocamRecordingInterface.json";
import IntanRecordingInterfaceSchema from "../../../../../../schemas/json/generated/IntanRecordingInterface.json";
import OpenEphysRecordingInterfaceSchema from "../../../../../../schemas/json/generated/OpenEphysRecordingInterface.json";

export default {
    title: "Pages/Guided Mode/Source Data",
    parameters: {
        chromatic: { disableSnapshot: false },
    },
};

const activePage = "conversion/sourcedata";

export const Example = PageTemplate.bind({});
Example.args = { activePage, globalState };

export const SpikeGLXRecordingInterface = PageTemplate.bind({});
const SpikeGLXRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
SpikeGLXRecordingInterfaceGlobalCopy.interfaces.interface = SpikeGLXRecordingInterface;
SpikeGLXRecordingInterfaceGlobalCopy.schema.source_data.properties.interface = SpikeGLXRecordingInterfaceSchema;
SpikeGLXRecordingInterface.args = { activePage, globalState: SpikeGLXRecordingInterfaceGlobalCopy };

export const SpikeGLXNIDQInterface = PageTemplate.bind({});
const SpikeGLXNIDQInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
SpikeGLXNIDQInterfaceGlobalCopy.interfaces.interface = SpikeGLXNIDQInterface;
SpikeGLXNIDQInterfaceGlobalCopy.schema.source_data.properties.interface = SpikeGLXNIDQInterfaceSchema;
SpikeGLXNIDQInterface.args = { activePage, globalState: SpikeGLXNIDQInterfaceGlobalCopy };

export const PhySortingInterface = PageTemplate.bind({});
const PhySortingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
PhySortingInterfaceGlobalCopy.interfaces.interface = PhySortingInterface;
PhySortingInterfaceGlobalCopy.schema.source_data.properties.interface = PhySortingInterfaceSchema;
PhySortingInterface.args = { activePage, globalState: PhySortingInterfaceGlobalCopy };

export const NeuroScopeRecordingInterface = PageTemplate.bind({});
const NeuroScopeRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
NeuroScopeRecordingInterfaceGlobalCopy.interfaces.interface = NeuroScopeRecordingInterface;
NeuroScopeRecordingInterfaceGlobalCopy.schema.source_data.properties.interface = NeuroScopeRecordingInterfaceSchema;
NeuroScopeRecordingInterface.args = { activePage, globalState: NeuroScopeRecordingInterfaceGlobalCopy };

export const NeuroScopeLFPInterface = PageTemplate.bind({});
const NeuroScopeLFPInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
NeuroScopeLFPInterfaceGlobalCopy.interfaces.interface = NeuroScopeLFPInterface;
NeuroScopeLFPInterfaceGlobalCopy.schema.source_data.properties.interface = NeuroScopeLFPInterfaceSchema;
NeuroScopeLFPInterface.args = { activePage, globalState: NeuroScopeLFPInterfaceGlobalCopy };

export const NeuroScopeSortingInterface = PageTemplate.bind({});
const NeuroScopeSortingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
NeuroScopeSortingInterfaceGlobalCopy.interfaces.interface = NeuroScopeSortingInterface;
NeuroScopeSortingInterfaceGlobalCopy.schema.source_data.properties.interface = NeuroScopeSortingInterfaceSchema;
NeuroScopeSortingInterface.args = { activePage, globalState: NeuroScopeSortingInterfaceGlobalCopy };

export const BiocamRecordingInterface = PageTemplate.bind({});
const BiocamRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
BiocamRecordingInterfaceGlobalCopy.interfaces.interface = BiocamRecordingInterface;
BiocamRecordingInterfaceGlobalCopy.schema.source_data.properties.interface = BiocamRecordingInterfaceSchema;
BiocamRecordingInterface.args = { activePage, globalState: BiocamRecordingInterfaceGlobalCopy };

export const IntanRecordingInterface = PageTemplate.bind({});
const IntanRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
IntanRecordingInterfaceGlobalCopy.interfaces.interface = IntanRecordingInterface;
IntanRecordingInterfaceGlobalCopy.schema.source_data.properties.interface = IntanRecordingInterfaceSchema;
IntanRecordingInterface.args = { activePage, globalState: IntanRecordingInterfaceGlobalCopy };

export const OpenEphysRecordingInterface = PageTemplate.bind({});
const OpenEphysRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
OpenEphysRecordingInterfaceGlobalCopy.interfaces.interface = OpenEphysRecordingInterface;
OpenEphysRecordingInterfaceGlobalCopy.schema.source_data.properties.interface = OpenEphysRecordingInterfaceSchema;
OpenEphysRecordingInterface.args = { activePage, globalState: OpenEphysRecordingInterfaceGlobalCopy };
