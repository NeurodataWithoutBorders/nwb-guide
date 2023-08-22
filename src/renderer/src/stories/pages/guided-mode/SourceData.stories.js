import { globalState, PageTemplate } from "./storyStates";
import SpikeGLXRecordingInterfaceSchema from '../../../../../../schemas/json/generated/SpikeGLXRecordingInterface.json'
import SpikeGLXNIDQInterfaceSchema from '../../../../../../schemas/json/generated/SpikeGLXNIDQInterface.json'
import PhySortingInterfaceSchema from '../../../../../../schemas/json/generated/PhySortingInterface.json'
import NeuroScopeRecordingInterfaceSchema from '../../../../../../schemas/json/generated/NeuroScopeRecordingInterface.json'
import NeuroScopeLFPInterfaceSchema from '../../../../../../schemas/json/generated/NeuroScopeLFPInterface.json'
import NeuroScopeSortingInterfaceSchema from '../../../../../../schemas/json/generated/NeuroScopeSortingInterface.json'
import BiocamRecordingInterfaceSchema from '../../../../../../schemas/json/generated/BiocamRecordingInterface.json'
import IntanRecordingInterfaceSchema from '../../../../../../schemas/json/generated/IntanRecordingInterface.json'
import OpenEphysRecordingInterfaceSchema from '../../../../../../schemas/json/generated/OpenEphysRecordingInterface.json'
import BlackrockRecordingInterfaceSchema from '../../../../../../schemas/json/generated/BlackrockRecordingInterface.json'
import BlackrockSortingInterfaceSchema from '../../../../../../schemas/json/generated/BlackrockSortingInterface.json'
import CellExplorerSortingInterfaceSchema from '../../../../../../schemas/json/generated/CellExplorerSortingInterface.json'
import KiloSortSortingInterfaceSchema from '../../../../../../schemas/json/generated/KiloSortSortingInterface.json'

export default {
    title: "Pages/Guided Mode/Source Data",
    parameters: {
        chromatic: { disableSnapshot: false },
    }
};

const activePage = "conversion/sourcedata"


export const Example = PageTemplate.bind({});
Example.args = { activePage, globalState };

export const SpikeGLXRecordingInterface = PageTemplate.bind({});
const SpikeGLXRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState))
SpikeGLXRecordingInterfaceGlobalCopy.interfaces.interface = SpikeGLXRecordingInterface
SpikeGLXRecordingInterfaceGlobalCopy.schema.source_data = SpikeGLXRecordingInterfaceSchema
SpikeGLXRecordingInterface.args = { activePage, globalState: SpikeGLXRecordingInterfaceGlobalCopy };

export const SpikeGLXNIDQInterface = PageTemplate.bind({});
const SpikeGLXNIDQInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState))
SpikeGLXNIDQInterfaceGlobalCopy.interfaces.interface = SpikeGLXNIDQInterface
SpikeGLXNIDQInterfaceGlobalCopy.schema.source_data = SpikeGLXNIDQInterfaceSchema
SpikeGLXNIDQInterface.args = { activePage, globalState: SpikeGLXNIDQInterfaceGlobalCopy };

export const PhySortingInterface = PageTemplate.bind({});
const PhySortingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState))
PhySortingInterfaceGlobalCopy.interfaces.interface = PhySortingInterface
PhySortingInterfaceGlobalCopy.schema.source_data = PhySortingInterfaceSchema
PhySortingInterface.args = { activePage, globalState: PhySortingInterfaceGlobalCopy };

export const NeuroScopeRecordingInterface = PageTemplate.bind({});
const NeuroScopeRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState))
NeuroScopeRecordingInterfaceGlobalCopy.interfaces.interface = NeuroScopeRecordingInterface
NeuroScopeRecordingInterfaceGlobalCopy.schema.source_data = NeuroScopeRecordingInterfaceSchema
NeuroScopeRecordingInterface.args = { activePage, globalState: NeuroScopeRecordingInterfaceGlobalCopy };

export const NeuroScopeLFPInterface = PageTemplate.bind({});
const NeuroScopeLFPInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState))
NeuroScopeLFPInterfaceGlobalCopy.interfaces.interface = NeuroScopeLFPInterface
NeuroScopeLFPInterfaceGlobalCopy.schema.source_data = NeuroScopeLFPInterfaceSchema
NeuroScopeLFPInterface.args = { activePage, globalState: NeuroScopeLFPInterfaceGlobalCopy };

export const NeuroScopeSortingInterface = PageTemplate.bind({});
const NeuroScopeSortingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState))
NeuroScopeSortingInterfaceGlobalCopy.interfaces.interface = NeuroScopeSortingInterface
NeuroScopeSortingInterfaceGlobalCopy.schema.source_data = NeuroScopeSortingInterfaceSchema
NeuroScopeSortingInterface.args = { activePage, globalState: NeuroScopeSortingInterfaceGlobalCopy };

export const BiocamRecordingInterface = PageTemplate.bind({});
const BiocamRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState))
BiocamRecordingInterfaceGlobalCopy.interfaces.interface = BiocamRecordingInterface
BiocamRecordingInterfaceGlobalCopy.schema.source_data = BiocamRecordingInterfaceSchema
BiocamRecordingInterface.args = { activePage, globalState: BiocamRecordingInterfaceGlobalCopy };

export const IntanRecordingInterface = PageTemplate.bind({});
const IntanRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState))
IntanRecordingInterfaceGlobalCopy.interfaces.interface = IntanRecordingInterface
IntanRecordingInterfaceGlobalCopy.schema.source_data = IntanRecordingInterfaceSchema
IntanRecordingInterface.args = { activePage, globalState: IntanRecordingInterfaceGlobalCopy };

export const OpenEphysRecordingInterface = PageTemplate.bind({});
const OpenEphysRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState))
OpenEphysRecordingInterfaceGlobalCopy.interfaces.interface = OpenEphysRecordingInterface
OpenEphysRecordingInterfaceGlobalCopy.schema.source_data = OpenEphysRecordingInterfaceSchema
OpenEphysRecordingInterface.args = { activePage, globalState: OpenEphysRecordingInterfaceGlobalCopy };

export const BlackrockRecordingInterface = PageTemplate.bind({});
const BlackrockRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState))
BlackrockRecordingInterfaceGlobalCopy.interfaces.interface = BlackrockRecordingInterface
BlackrockRecordingInterfaceGlobalCopy.schema.source_data = BlackrockRecordingInterfaceSchema
BlackrockRecordingInterface.args = { activePage, globalState: BlackrockRecordingInterfaceGlobalCopy };

export const BlackrockSortingInterface = PageTemplate.bind({});
const BlackrockSortingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState))
BlackrockSortingInterfaceGlobalCopy.interfaces.interface = BlackrockSortingInterface
BlackrockSortingInterfaceGlobalCopy.schema.source_data = BlackrockSortingInterfaceSchema
BlackrockSortingInterface.args = { activePage, globalState: BlackrockSortingInterfaceGlobalCopy };

export const CellExplorerSortingInterface = PageTemplate.bind({});
const CellExplorerSortingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState))
CellExplorerSortingInterfaceGlobalCopy.interfaces.interface = CellExplorerSortingInterface
CellExplorerSortingInterfaceGlobalCopy.schema.source_data = CellExplorerSortingInterfaceSchema
CellExplorerSortingInterface.args = { activePage, globalState: CellExplorerSortingInterfaceGlobalCopy };

export const KiloSortSortingInterface = PageTemplate.bind({});
const KiloSortSortingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState))
KiloSortSortingInterfaceGlobalCopy.interfaces.interface = KiloSortSortingInterface
KiloSortSortingInterfaceGlobalCopy.schema.source_data = KiloSortSortingInterfaceSchema
KiloSortSortingInterface.args = { activePage, globalState: KiloSortSortingInterfaceGlobalCopy };

