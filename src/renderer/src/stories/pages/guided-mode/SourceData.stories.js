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
import BlackrockRecordingInterfaceSchema from "../../../../../../schemas/json/generated/BlackrockRecordingInterface.json";
import BlackrockSortingInterfaceSchema from "../../../../../../schemas/json/generated/BlackrockSortingInterface.json";
import CellExplorerSortingInterfaceSchema from "../../../../../../schemas/json/generated/CellExplorerSortingInterface.json";
import KiloSortSortingInterfaceSchema from "../../../../../../schemas/json/generated/KiloSortSortingInterface.json";
import Spike2RecordingInterfaceSchema from "../../../../../../schemas/json/generated/Spike2RecordingInterface.json";
import BrukerTiffSinglePlaneImagingInterfaceSchema from "../../../../../../schemas/json/generated/BrukerTiffSinglePlaneImagingInterface.json";
import ExtractSegmentationInterfaceSchema from "../../../../../../schemas/json/generated/ExtractSegmentationInterface.json";
import BrukerTiffMultiPlaneImagingInterfaceSchema from "../../../../../../schemas/json/generated/BrukerTiffMultiPlaneImagingInterface.json";
import MicroManagerTiffImagingInterfaceSchema from "../../../../../../schemas/json/generated/MicroManagerTiffImagingInterface.json";
import ScanImageImagingInterfaceSchema from "../../../../../../schemas/json/generated/ScanImageImagingInterface.json";
import TiffImagingInterfaceSchema from "../../../../../../schemas/json/generated/TiffImagingInterface.json";
import MiniscopeImagingInterfaceSchema from "../../../../../../schemas/json/generated/MiniscopeImagingInterface.json";
import SbxImagingInterfaceSchema from "../../../../../../schemas/json/generated/SbxImagingInterface.json";
import CaimanSegmentationInterfaceSchema from "../../../../../../schemas/json/generated/CaimanSegmentationInterface.json";
import MCSRawRecordingInterfaceSchema from "../../../../../../schemas/json/generated/MCSRawRecordingInterface.json";
import MEArecRecordingInterfaceSchema from "../../../../../../schemas/json/generated/MEArecRecordingInterface.json";
import PlexonRecordingInterfaceSchema from "../../../../../../schemas/json/generated/PlexonRecordingInterface.json";
import PlexonSortingInterfaceSchema from "../../../../../../schemas/json/generated/PlexonSortingInterface.json";
import AxonaRecordingInterfaceSchema from "../../../../../../schemas/json/generated/AxonaRecordingInterface.json";
import NeuralynxRecordingInterfaceSchema from "../../../../../../schemas/json/generated/NeuralynxRecordingInterface.json";
import AlphaOmegaRecordingInterfaceSchema from "../../../../../../schemas/json/generated/AlphaOmegaRecordingInterface.json";

export default {
    title: "Pages/Guided Mode/Source Data",
    parameters: {
        chromatic: { disableSnapshot: false },
    },
};

const activePage = "conversion/sourcedata";

const globalStateCopy = JSON.parse(JSON.stringify(globalState));
globalStateCopy.schema.source_data.properties.SpikeGLXRecordingInterface =
    SpikeGLXRecordingInterfaceSchema.properties.SpikeGLXRecordingInterface;
globalStateCopy.schema.source_data.properties.SpikeGLXNIDQInterface =
    SpikeGLXNIDQInterfaceSchema.properties.SpikeGLXNIDQInterface;
globalStateCopy.schema.source_data.properties.PhySortingInterface =
    PhySortingInterfaceSchema.properties.PhySortingInterface;
globalStateCopy.schema.source_data.properties.NeuroScopeRecordingInterface =
    NeuroScopeRecordingInterfaceSchema.properties.NeuroScopeRecordingInterface;
globalStateCopy.schema.source_data.properties.NeuroScopeLFPInterface =
    NeuroScopeLFPInterfaceSchema.properties.NeuroScopeLFPInterface;
globalStateCopy.schema.source_data.properties.NeuroScopeSortingInterface =
    NeuroScopeSortingInterfaceSchema.properties.NeuroScopeSortingInterface;
globalStateCopy.schema.source_data.properties.BiocamRecordingInterface =
    BiocamRecordingInterfaceSchema.properties.BiocamRecordingInterface;
globalStateCopy.schema.source_data.properties.IntanRecordingInterface =
    IntanRecordingInterfaceSchema.properties.IntanRecordingInterface;
globalStateCopy.schema.source_data.properties.OpenEphysRecordingInterface =
    OpenEphysRecordingInterfaceSchema.properties.OpenEphysRecordingInterface;
globalStateCopy.schema.source_data.properties.BlackrockRecordingInterface =
    BlackrockRecordingInterfaceSchema.properties.BlackrockRecordingInterface;
globalStateCopy.schema.source_data.properties.BlackrockSortingInterface =
    BlackrockSortingInterfaceSchema.properties.BlackrockSortingInterface;
globalStateCopy.schema.source_data.properties.CellExplorerSortingInterface =
    CellExplorerSortingInterfaceSchema.properties.CellExplorerSortingInterface;
globalStateCopy.schema.source_data.properties.KiloSortSortingInterface =
    KiloSortSortingInterfaceSchema.properties.KiloSortSortingInterface;
globalStateCopy.schema.source_data.properties.Spike2RecordingInterface =
    Spike2RecordingInterfaceSchema.properties.Spike2RecordingInterface;
globalStateCopy.schema.source_data.properties.BrukerTiffSinglePlaneImagingInterface =
    BrukerTiffSinglePlaneImagingInterfaceSchema.properties.BrukerTiffSinglePlaneImagingInterface;
globalStateCopy.schema.source_data.properties.ExtractSegmentationInterface =
    ExtractSegmentationInterfaceSchema.properties.ExtractSegmentationInterface;
globalStateCopy.schema.source_data.properties.BrukerTiffMultiPlaneImagingInterface =
    BrukerTiffMultiPlaneImagingInterfaceSchema.properties.BrukerTiffMultiPlaneImagingInterface;
globalStateCopy.schema.source_data.properties.MicroManagerTiffImagingInterface =
    MicroManagerTiffImagingInterfaceSchema.properties.MicroManagerTiffImagingInterface;
globalStateCopy.schema.source_data.properties.ScanImageImagingInterface =
    ScanImageImagingInterfaceSchema.properties.ScanImageImagingInterface;
globalStateCopy.schema.source_data.properties.TiffImagingInterface =
    TiffImagingInterfaceSchema.properties.TiffImagingInterface;
globalStateCopy.schema.source_data.properties.MiniscopeImagingInterface =
    MiniscopeImagingInterfaceSchema.properties.MiniscopeImagingInterface;
globalStateCopy.schema.source_data.properties.SbxImagingInterface =
    SbxImagingInterfaceSchema.properties.SbxImagingInterface;
globalStateCopy.schema.source_data.properties.CaimanSegmentationInterface =
    CaimanSegmentationInterfaceSchema.properties.CaimanSegmentationInterface;
globalStateCopy.schema.source_data.properties.MCSRawRecordingInterface =
    MCSRawRecordingInterfaceSchema.properties.MCSRawRecordingInterface;
globalStateCopy.schema.source_data.properties.MEArecRecordingInterface =
    MEArecRecordingInterfaceSchema.properties.MEArecRecordingInterface;
globalStateCopy.schema.source_data.properties.PlexonRecordingInterface =
    PlexonRecordingInterfaceSchema.properties.PlexonRecordingInterface;
globalStateCopy.schema.source_data.properties.PlexonSortingInterface =
    PlexonSortingInterfaceSchema.properties.PlexonSortingInterface;
globalStateCopy.schema.source_data.properties.AxonaRecordingInterface =
    AxonaRecordingInterfaceSchema.properties.AxonaRecordingInterface;
globalStateCopy.schema.source_data.properties.NeuralynxRecordingInterface =
    NeuralynxRecordingInterfaceSchema.properties.NeuralynxRecordingInterface;
globalStateCopy.schema.source_data.properties.AlphaOmegaRecordingInterface =
    AlphaOmegaRecordingInterfaceSchema.properties.AlphaOmegaRecordingInterface;

const results = globalStateCopy.results;
for (let sub in results) {
    for (let ses in results[sub])
        results[sub][ses].source_data = { SpikeGLXNIDQInterface: { file_path: "/dummy/file/path" } };
}

export const All = PageTemplate.bind({});
All.args = { activePage, globalState: globalStateCopy };

export const SpikeGLXRecordingInterface = PageTemplate.bind({});
const SpikeGLXRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
SpikeGLXRecordingInterfaceGlobalCopy.interfaces.interface = SpikeGLXRecordingInterface;
SpikeGLXRecordingInterfaceGlobalCopy.schema.source_data = SpikeGLXRecordingInterfaceSchema;
SpikeGLXRecordingInterface.args = { activePage, globalState: SpikeGLXRecordingInterfaceGlobalCopy };

export const SpikeGLXNIDQInterface = PageTemplate.bind({});
const SpikeGLXNIDQInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
SpikeGLXNIDQInterfaceGlobalCopy.interfaces.interface = SpikeGLXNIDQInterface;
SpikeGLXNIDQInterfaceGlobalCopy.schema.source_data = SpikeGLXNIDQInterfaceSchema;
SpikeGLXNIDQInterface.args = { activePage, globalState: SpikeGLXNIDQInterfaceGlobalCopy };

export const PhySortingInterface = PageTemplate.bind({});
const PhySortingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
PhySortingInterfaceGlobalCopy.interfaces.interface = PhySortingInterface;
PhySortingInterfaceGlobalCopy.schema.source_data = PhySortingInterfaceSchema;
PhySortingInterface.args = { activePage, globalState: PhySortingInterfaceGlobalCopy };

export const NeuroScopeRecordingInterface = PageTemplate.bind({});
const NeuroScopeRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
NeuroScopeRecordingInterfaceGlobalCopy.interfaces.interface = NeuroScopeRecordingInterface;
NeuroScopeRecordingInterfaceGlobalCopy.schema.source_data = NeuroScopeRecordingInterfaceSchema;
NeuroScopeRecordingInterface.args = { activePage, globalState: NeuroScopeRecordingInterfaceGlobalCopy };

export const NeuroScopeLFPInterface = PageTemplate.bind({});
const NeuroScopeLFPInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
NeuroScopeLFPInterfaceGlobalCopy.interfaces.interface = NeuroScopeLFPInterface;
NeuroScopeLFPInterfaceGlobalCopy.schema.source_data = NeuroScopeLFPInterfaceSchema;
NeuroScopeLFPInterface.args = { activePage, globalState: NeuroScopeLFPInterfaceGlobalCopy };

export const NeuroScopeSortingInterface = PageTemplate.bind({});
const NeuroScopeSortingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
NeuroScopeSortingInterfaceGlobalCopy.interfaces.interface = NeuroScopeSortingInterface;
NeuroScopeSortingInterfaceGlobalCopy.schema.source_data = NeuroScopeSortingInterfaceSchema;
NeuroScopeSortingInterface.args = { activePage, globalState: NeuroScopeSortingInterfaceGlobalCopy };

export const BiocamRecordingInterface = PageTemplate.bind({});
const BiocamRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
BiocamRecordingInterfaceGlobalCopy.interfaces.interface = BiocamRecordingInterface;
BiocamRecordingInterfaceGlobalCopy.schema.source_data = BiocamRecordingInterfaceSchema;
BiocamRecordingInterface.args = { activePage, globalState: BiocamRecordingInterfaceGlobalCopy };

export const IntanRecordingInterface = PageTemplate.bind({});
const IntanRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
IntanRecordingInterfaceGlobalCopy.interfaces.interface = IntanRecordingInterface;
IntanRecordingInterfaceGlobalCopy.schema.source_data = IntanRecordingInterfaceSchema;
IntanRecordingInterface.args = { activePage, globalState: IntanRecordingInterfaceGlobalCopy };

export const OpenEphysRecordingInterface = PageTemplate.bind({});
const OpenEphysRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
OpenEphysRecordingInterfaceGlobalCopy.interfaces.interface = OpenEphysRecordingInterface;
OpenEphysRecordingInterfaceGlobalCopy.schema.source_data = OpenEphysRecordingInterfaceSchema;
OpenEphysRecordingInterface.args = { activePage, globalState: OpenEphysRecordingInterfaceGlobalCopy };

export const BlackrockRecordingInterface = PageTemplate.bind({});
const BlackrockRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
BlackrockRecordingInterfaceGlobalCopy.interfaces.interface = BlackrockRecordingInterface;
BlackrockRecordingInterfaceGlobalCopy.schema.source_data = BlackrockRecordingInterfaceSchema;
BlackrockRecordingInterface.args = { activePage, globalState: BlackrockRecordingInterfaceGlobalCopy };

export const BlackrockSortingInterface = PageTemplate.bind({});
const BlackrockSortingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
BlackrockSortingInterfaceGlobalCopy.interfaces.interface = BlackrockSortingInterface;
BlackrockSortingInterfaceGlobalCopy.schema.source_data = BlackrockSortingInterfaceSchema;
BlackrockSortingInterface.args = { activePage, globalState: BlackrockSortingInterfaceGlobalCopy };

export const CellExplorerSortingInterface = PageTemplate.bind({});
const CellExplorerSortingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
CellExplorerSortingInterfaceGlobalCopy.interfaces.interface = CellExplorerSortingInterface;
CellExplorerSortingInterfaceGlobalCopy.schema.source_data = CellExplorerSortingInterfaceSchema;
CellExplorerSortingInterface.args = { activePage, globalState: CellExplorerSortingInterfaceGlobalCopy };

export const KiloSortSortingInterface = PageTemplate.bind({});
const KiloSortSortingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
KiloSortSortingInterfaceGlobalCopy.interfaces.interface = KiloSortSortingInterface;
KiloSortSortingInterfaceGlobalCopy.schema.source_data = KiloSortSortingInterfaceSchema;
KiloSortSortingInterface.args = { activePage, globalState: KiloSortSortingInterfaceGlobalCopy };

export const Spike2RecordingInterface = PageTemplate.bind({});
const Spike2RecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
Spike2RecordingInterfaceGlobalCopy.interfaces.interface = Spike2RecordingInterface;
Spike2RecordingInterfaceGlobalCopy.schema.source_data = Spike2RecordingInterfaceSchema;
Spike2RecordingInterface.args = { activePage, globalState: Spike2RecordingInterfaceGlobalCopy };

export const BrukerTiffSinglePlaneImagingInterface = PageTemplate.bind({});
const BrukerTiffSinglePlaneImagingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
BrukerTiffSinglePlaneImagingInterfaceGlobalCopy.interfaces.interface = BrukerTiffSinglePlaneImagingInterface;
BrukerTiffSinglePlaneImagingInterfaceGlobalCopy.schema.source_data = BrukerTiffSinglePlaneImagingInterfaceSchema;
BrukerTiffSinglePlaneImagingInterface.args = {
    activePage,
    globalState: BrukerTiffSinglePlaneImagingInterfaceGlobalCopy,
};

export const ExtractSegmentationInterface = PageTemplate.bind({});
const ExtractSegmentationInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
ExtractSegmentationInterfaceGlobalCopy.interfaces.interface = ExtractSegmentationInterface;
ExtractSegmentationInterfaceGlobalCopy.schema.source_data = ExtractSegmentationInterfaceSchema;
ExtractSegmentationInterface.args = { activePage, globalState: ExtractSegmentationInterfaceGlobalCopy };

export const BrukerTiffMultiPlaneImagingInterface = PageTemplate.bind({});
const BrukerTiffMultiPlaneImagingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
BrukerTiffMultiPlaneImagingInterfaceGlobalCopy.interfaces.interface = BrukerTiffMultiPlaneImagingInterface;
BrukerTiffMultiPlaneImagingInterfaceGlobalCopy.schema.source_data = BrukerTiffMultiPlaneImagingInterfaceSchema;
BrukerTiffMultiPlaneImagingInterface.args = { activePage, globalState: BrukerTiffMultiPlaneImagingInterfaceGlobalCopy };

export const MicroManagerTiffImagingInterface = PageTemplate.bind({});
const MicroManagerTiffImagingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
MicroManagerTiffImagingInterfaceGlobalCopy.interfaces.interface = MicroManagerTiffImagingInterface;
MicroManagerTiffImagingInterfaceGlobalCopy.schema.source_data = MicroManagerTiffImagingInterfaceSchema;
MicroManagerTiffImagingInterface.args = { activePage, globalState: MicroManagerTiffImagingInterfaceGlobalCopy };

export const ScanImageImagingInterface = PageTemplate.bind({});
const ScanImageImagingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
ScanImageImagingInterfaceGlobalCopy.interfaces.interface = ScanImageImagingInterface;
ScanImageImagingInterfaceGlobalCopy.schema.source_data = ScanImageImagingInterfaceSchema;
ScanImageImagingInterface.args = { activePage, globalState: ScanImageImagingInterfaceGlobalCopy };

export const TiffImagingInterface = PageTemplate.bind({});
const TiffImagingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
TiffImagingInterfaceGlobalCopy.interfaces.interface = TiffImagingInterface;
TiffImagingInterfaceGlobalCopy.schema.source_data = TiffImagingInterfaceSchema;
TiffImagingInterface.args = { activePage, globalState: TiffImagingInterfaceGlobalCopy };

export const MiniscopeImagingInterface = PageTemplate.bind({});
const MiniscopeImagingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
MiniscopeImagingInterfaceGlobalCopy.interfaces.interface = MiniscopeImagingInterface;
MiniscopeImagingInterfaceGlobalCopy.schema.source_data = MiniscopeImagingInterfaceSchema;
MiniscopeImagingInterface.args = { activePage, globalState: MiniscopeImagingInterfaceGlobalCopy };

export const SbxImagingInterface = PageTemplate.bind({});
const SbxImagingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
SbxImagingInterfaceGlobalCopy.interfaces.interface = SbxImagingInterface;
SbxImagingInterfaceGlobalCopy.schema.source_data = SbxImagingInterfaceSchema;
SbxImagingInterface.args = { activePage, globalState: SbxImagingInterfaceGlobalCopy };

export const CaimanSegmentationInterface = PageTemplate.bind({});
const CaimanSegmentationInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
CaimanSegmentationInterfaceGlobalCopy.interfaces.interface = CaimanSegmentationInterface;
CaimanSegmentationInterfaceGlobalCopy.schema.source_data = CaimanSegmentationInterfaceSchema;
CaimanSegmentationInterface.args = { activePage, globalState: CaimanSegmentationInterfaceGlobalCopy };

export const MCSRawRecordingInterface = PageTemplate.bind({});
const MCSRawRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
MCSRawRecordingInterfaceGlobalCopy.interfaces.interface = MCSRawRecordingInterface;
MCSRawRecordingInterfaceGlobalCopy.schema.source_data = MCSRawRecordingInterfaceSchema;
MCSRawRecordingInterface.args = { activePage, globalState: MCSRawRecordingInterfaceGlobalCopy };

export const MEArecRecordingInterface = PageTemplate.bind({});
const MEArecRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
MEArecRecordingInterfaceGlobalCopy.interfaces.interface = MEArecRecordingInterface;
MEArecRecordingInterfaceGlobalCopy.schema.source_data = MEArecRecordingInterfaceSchema;
MEArecRecordingInterface.args = { activePage, globalState: MEArecRecordingInterfaceGlobalCopy };

export const PlexonRecordingInterface = PageTemplate.bind({});
const PlexonRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
PlexonRecordingInterfaceGlobalCopy.interfaces.interface = PlexonRecordingInterface;
PlexonRecordingInterfaceGlobalCopy.schema.source_data = PlexonRecordingInterfaceSchema;
PlexonRecordingInterface.args = { activePage, globalState: PlexonRecordingInterfaceGlobalCopy };

export const PlexonSortingInterface = PageTemplate.bind({});
const PlexonSortingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
PlexonSortingInterfaceGlobalCopy.interfaces.interface = PlexonSortingInterface;
PlexonSortingInterfaceGlobalCopy.schema.source_data = PlexonSortingInterfaceSchema;
PlexonSortingInterface.args = { activePage, globalState: PlexonSortingInterfaceGlobalCopy };

export const AxonaRecordingInterface = PageTemplate.bind({});
const AxonaRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
AxonaRecordingInterfaceGlobalCopy.interfaces.interface = AxonaRecordingInterface;
AxonaRecordingInterfaceGlobalCopy.schema.source_data = AxonaRecordingInterfaceSchema;
AxonaRecordingInterface.args = { activePage, globalState: AxonaRecordingInterfaceGlobalCopy };

export const NeuralynxRecordingInterface = PageTemplate.bind({});
const NeuralynxRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
NeuralynxRecordingInterfaceGlobalCopy.interfaces.interface = NeuralynxRecordingInterface;
NeuralynxRecordingInterfaceGlobalCopy.schema.source_data = NeuralynxRecordingInterfaceSchema;
NeuralynxRecordingInterface.args = { activePage, globalState: NeuralynxRecordingInterfaceGlobalCopy };

export const AlphaOmegaRecordingInterface = PageTemplate.bind({});
const AlphaOmegaRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
AlphaOmegaRecordingInterfaceGlobalCopy.interfaces.interface = AlphaOmegaRecordingInterface;
AlphaOmegaRecordingInterfaceGlobalCopy.schema.source_data = AlphaOmegaRecordingInterfaceSchema;
AlphaOmegaRecordingInterface.args = { activePage, globalState: AlphaOmegaRecordingInterfaceGlobalCopy };
