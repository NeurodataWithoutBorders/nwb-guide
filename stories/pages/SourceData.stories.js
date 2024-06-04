import { globalState, PageTemplate } from "./storyStates";
import SpikeGLXRecordingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/SpikeGLXRecordingInterface.json";
import SpikeGLXNIDQInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/SpikeGLXNIDQInterface.json";
import PhySortingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/PhySortingInterface.json";
import NeuroScopeRecordingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/NeuroScopeRecordingInterface.json";
import NeuroScopeLFPInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/NeuroScopeLFPInterface.json";
import NeuroScopeSortingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/NeuroScopeSortingInterface.json";
import BiocamRecordingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/BiocamRecordingInterface.json";
import IntanRecordingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/IntanRecordingInterface.json";
import OpenEphysRecordingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/OpenEphysRecordingInterface.json";
import BlackrockRecordingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/BlackrockRecordingInterface.json";
import BlackrockSortingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/BlackrockSortingInterface.json";
import CellExplorerSortingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/CellExplorerSortingInterface.json";
import KiloSortSortingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/KiloSortSortingInterface.json";
import TdtRecordingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/TdtRecordingInterface.json";
import Spike2RecordingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/Spike2RecordingInterface.json";
import BrukerTiffSinglePlaneImagingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/BrukerTiffSinglePlaneImagingInterface.json";
import ExtractSegmentationInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/ExtractSegmentationInterface.json";
import CnmfeSegmentationInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/CnmfeSegmentationInterface.json";
import BrukerTiffMultiPlaneImagingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/BrukerTiffMultiPlaneImagingInterface.json";
import MicroManagerTiffImagingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/MicroManagerTiffImagingInterface.json";
import ScanImageImagingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/ScanImageImagingInterface.json";
import TiffImagingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/TiffImagingInterface.json";
import MiniscopeImagingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/MiniscopeImagingInterface.json";
import SbxImagingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/SbxImagingInterface.json";
import CaimanSegmentationInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/CaimanSegmentationInterface.json";
import MCSRawRecordingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/MCSRawRecordingInterface.json";
import MEArecRecordingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/MEArecRecordingInterface.json";
import PlexonRecordingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/PlexonRecordingInterface.json";
import PlexonSortingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/PlexonSortingInterface.json";
import AxonaRecordingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/AxonaRecordingInterface.json";
import VideoInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/VideoInterface.json";
import NeuralynxRecordingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/NeuralynxRecordingInterface.json";
import Suite2pSegmentationInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/Suite2pSegmentationInterface.json";
import AlphaOmegaRecordingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/AlphaOmegaRecordingInterface.json";
import DeepLabCutInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/DeepLabCutInterface.json";
import SLEAPInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/SLEAPInterface.json";
import FicTracDataInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/FicTracDataInterface.json";
import AudioInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/AudioInterface.json";
import MiniscopeBehaviorInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/MiniscopeBehaviorInterface.json";
import EDFRecordingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/EDFRecordingInterface.json";
import SpikeGLXConverterPipeSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/SpikeGLXConverterPipe.json";
import BrukerTiffSinglePlaneConverterSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/BrukerTiffSinglePlaneConverter.json";
import BrukerTiffMultiPlaneConverterSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/BrukerTiffMultiPlaneConverter.json";
import MiniscopeConverterSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/MiniscopeConverter.json";
import CellExplorerRecordingInterfaceSchema from "../inputs/interface_schemas/stories/inputs/interface_schemas/CellExplorerRecordingInterface.json";

export default {
    title: "Pages/Guided Mode/Source Data",
    parameters: {
        chromatic: { disableSnapshot: false },
    },
};

const activePage = "//sourcedata";

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
globalStateCopy.schema.source_data.properties.TdtRecordingInterface =
    TdtRecordingInterfaceSchema.properties.TdtRecordingInterface;
globalStateCopy.schema.source_data.properties.Spike2RecordingInterface =
    Spike2RecordingInterfaceSchema.properties.Spike2RecordingInterface;
globalStateCopy.schema.source_data.properties.BrukerTiffSinglePlaneImagingInterface =
    BrukerTiffSinglePlaneImagingInterfaceSchema.properties.BrukerTiffSinglePlaneImagingInterface;
globalStateCopy.schema.source_data.properties.ExtractSegmentationInterface =
    ExtractSegmentationInterfaceSchema.properties.ExtractSegmentationInterface;
globalStateCopy.schema.source_data.properties.CnmfeSegmentationInterface =
    CnmfeSegmentationInterfaceSchema.properties.CnmfeSegmentationInterface;
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
globalStateCopy.schema.source_data.properties.VideoInterface = VideoInterfaceSchema.properties.VideoInterface;
globalStateCopy.schema.source_data.properties.NeuralynxRecordingInterface =
    NeuralynxRecordingInterfaceSchema.properties.NeuralynxRecordingInterface;
globalStateCopy.schema.source_data.properties.Suite2pSegmentationInterface =
    Suite2pSegmentationInterfaceSchema.properties.Suite2pSegmentationInterface;
globalStateCopy.schema.source_data.properties.AlphaOmegaRecordingInterface =
    AlphaOmegaRecordingInterfaceSchema.properties.AlphaOmegaRecordingInterface;
globalStateCopy.schema.source_data.properties.DeepLabCutInterface =
    DeepLabCutInterfaceSchema.properties.DeepLabCutInterface;
globalStateCopy.schema.source_data.properties.SLEAPInterface = SLEAPInterfaceSchema.properties.SLEAPInterface;
globalStateCopy.schema.source_data.properties.FicTracDataInterface =
    FicTracDataInterfaceSchema.properties.FicTracDataInterface;
globalStateCopy.schema.source_data.properties.AudioInterface = AudioInterfaceSchema.properties.AudioInterface;
globalStateCopy.schema.source_data.properties.MiniscopeBehaviorInterface =
    MiniscopeBehaviorInterfaceSchema.properties.MiniscopeBehaviorInterface;
globalStateCopy.schema.source_data.properties.EDFRecordingInterface =
    EDFRecordingInterfaceSchema.properties.EDFRecordingInterface;
globalStateCopy.schema.source_data.properties.SpikeGLXConverterPipe =
    SpikeGLXConverterPipeSchema.properties.SpikeGLXConverterPipe;
globalStateCopy.schema.source_data.properties.BrukerTiffSinglePlaneConverter =
    BrukerTiffSinglePlaneConverterSchema.properties.BrukerTiffSinglePlaneConverter;
globalStateCopy.schema.source_data.properties.BrukerTiffMultiPlaneConverter =
    BrukerTiffMultiPlaneConverterSchema.properties.BrukerTiffMultiPlaneConverter;
globalStateCopy.schema.source_data.properties.MiniscopeConverter =
    MiniscopeConverterSchema.properties.MiniscopeConverter;
globalStateCopy.schema.source_data.properties.CellExplorerRecordingInterface =
    CellExplorerRecordingInterfaceSchema.properties.CellExplorerRecordingInterface;

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

export const TdtRecordingInterface = PageTemplate.bind({});
const TdtRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
TdtRecordingInterfaceGlobalCopy.interfaces.interface = TdtRecordingInterface;
TdtRecordingInterfaceGlobalCopy.schema.source_data = TdtRecordingInterfaceSchema;
TdtRecordingInterface.args = { activePage, globalState: TdtRecordingInterfaceGlobalCopy };

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

export const CnmfeSegmentationInterface = PageTemplate.bind({});
const CnmfeSegmentationInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
CnmfeSegmentationInterfaceGlobalCopy.interfaces.interface = CnmfeSegmentationInterface;
CnmfeSegmentationInterfaceGlobalCopy.schema.source_data = CnmfeSegmentationInterfaceSchema;
CnmfeSegmentationInterface.args = { activePage, globalState: CnmfeSegmentationInterfaceGlobalCopy };

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

export const VideoInterface = PageTemplate.bind({});
const VideoInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
VideoInterfaceGlobalCopy.interfaces.interface = VideoInterface;
VideoInterfaceGlobalCopy.schema.source_data = VideoInterfaceSchema;
VideoInterface.args = { activePage, globalState: VideoInterfaceGlobalCopy };

export const NeuralynxRecordingInterface = PageTemplate.bind({});
const NeuralynxRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
NeuralynxRecordingInterfaceGlobalCopy.interfaces.interface = NeuralynxRecordingInterface;
NeuralynxRecordingInterfaceGlobalCopy.schema.source_data = NeuralynxRecordingInterfaceSchema;
NeuralynxRecordingInterface.args = { activePage, globalState: NeuralynxRecordingInterfaceGlobalCopy };

export const Suite2pSegmentationInterface = PageTemplate.bind({});
const Suite2pSegmentationInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
Suite2pSegmentationInterfaceGlobalCopy.interfaces.interface = Suite2pSegmentationInterface;
Suite2pSegmentationInterfaceGlobalCopy.schema.source_data = Suite2pSegmentationInterfaceSchema;
Suite2pSegmentationInterface.args = { activePage, globalState: Suite2pSegmentationInterfaceGlobalCopy };

export const AlphaOmegaRecordingInterface = PageTemplate.bind({});
const AlphaOmegaRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
AlphaOmegaRecordingInterfaceGlobalCopy.interfaces.interface = AlphaOmegaRecordingInterface;
AlphaOmegaRecordingInterfaceGlobalCopy.schema.source_data = AlphaOmegaRecordingInterfaceSchema;
AlphaOmegaRecordingInterface.args = { activePage, globalState: AlphaOmegaRecordingInterfaceGlobalCopy };

export const DeepLabCutInterface = PageTemplate.bind({});
const DeepLabCutInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
DeepLabCutInterfaceGlobalCopy.interfaces.interface = DeepLabCutInterface;
DeepLabCutInterfaceGlobalCopy.schema.source_data = DeepLabCutInterfaceSchema;
DeepLabCutInterface.args = { activePage, globalState: DeepLabCutInterfaceGlobalCopy };

export const SLEAPInterface = PageTemplate.bind({});
const SLEAPInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
SLEAPInterfaceGlobalCopy.interfaces.interface = SLEAPInterface;
SLEAPInterfaceGlobalCopy.schema.source_data = SLEAPInterfaceSchema;
SLEAPInterface.args = { activePage, globalState: SLEAPInterfaceGlobalCopy };

export const FicTracDataInterface = PageTemplate.bind({});
const FicTracDataInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
FicTracDataInterfaceGlobalCopy.interfaces.interface = FicTracDataInterface;
FicTracDataInterfaceGlobalCopy.schema.source_data = FicTracDataInterfaceSchema;
FicTracDataInterface.args = { activePage, globalState: FicTracDataInterfaceGlobalCopy };

export const AudioInterface = PageTemplate.bind({});
const AudioInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
AudioInterfaceGlobalCopy.interfaces.interface = AudioInterface;
AudioInterfaceGlobalCopy.schema.source_data = AudioInterfaceSchema;
AudioInterface.args = { activePage, globalState: AudioInterfaceGlobalCopy };

export const MiniscopeBehaviorInterface = PageTemplate.bind({});
const MiniscopeBehaviorInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
MiniscopeBehaviorInterfaceGlobalCopy.interfaces.interface = MiniscopeBehaviorInterface;
MiniscopeBehaviorInterfaceGlobalCopy.schema.source_data = MiniscopeBehaviorInterfaceSchema;
MiniscopeBehaviorInterface.args = { activePage, globalState: MiniscopeBehaviorInterfaceGlobalCopy };

export const EDFRecordingInterface = PageTemplate.bind({});
const EDFRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
EDFRecordingInterfaceGlobalCopy.interfaces.interface = EDFRecordingInterface;
EDFRecordingInterfaceGlobalCopy.schema.source_data = EDFRecordingInterfaceSchema;
EDFRecordingInterface.args = { activePage, globalState: EDFRecordingInterfaceGlobalCopy };

export const SpikeGLXConverterPipe = PageTemplate.bind({});
const SpikeGLXConverterPipeGlobalCopy = JSON.parse(JSON.stringify(globalState));
SpikeGLXConverterPipeGlobalCopy.interfaces.interface = SpikeGLXConverterPipe;
SpikeGLXConverterPipeGlobalCopy.schema.source_data = SpikeGLXConverterPipeSchema;
SpikeGLXConverterPipe.args = { activePage, globalState: SpikeGLXConverterPipeGlobalCopy };

export const BrukerTiffSinglePlaneConverter = PageTemplate.bind({});
const BrukerTiffSinglePlaneConverterGlobalCopy = JSON.parse(JSON.stringify(globalState));
BrukerTiffSinglePlaneConverterGlobalCopy.interfaces.interface = BrukerTiffSinglePlaneConverter;
BrukerTiffSinglePlaneConverterGlobalCopy.schema.source_data = BrukerTiffSinglePlaneConverterSchema;
BrukerTiffSinglePlaneConverter.args = { activePage, globalState: BrukerTiffSinglePlaneConverterGlobalCopy };

export const BrukerTiffMultiPlaneConverter = PageTemplate.bind({});
const BrukerTiffMultiPlaneConverterGlobalCopy = JSON.parse(JSON.stringify(globalState));
BrukerTiffMultiPlaneConverterGlobalCopy.interfaces.interface = BrukerTiffMultiPlaneConverter;
BrukerTiffMultiPlaneConverterGlobalCopy.schema.source_data = BrukerTiffMultiPlaneConverterSchema;
BrukerTiffMultiPlaneConverter.args = { activePage, globalState: BrukerTiffMultiPlaneConverterGlobalCopy };

export const MiniscopeConverter = PageTemplate.bind({});
const MiniscopeConverterGlobalCopy = JSON.parse(JSON.stringify(globalState));
MiniscopeConverterGlobalCopy.interfaces.interface = MiniscopeConverter;
MiniscopeConverterGlobalCopy.schema.source_data = MiniscopeConverterSchema;
MiniscopeConverter.args = { activePage, globalState: MiniscopeConverterGlobalCopy };

export const CellExplorerRecordingInterface = PageTemplate.bind({});
const CellExplorerRecordingInterfaceGlobalCopy = JSON.parse(JSON.stringify(globalState));
CellExplorerRecordingInterfaceGlobalCopy.interfaces.interface = CellExplorerRecordingInterface;
CellExplorerRecordingInterfaceGlobalCopy.schema.source_data = CellExplorerRecordingInterfaceSchema;
CellExplorerRecordingInterface.args = { activePage, globalState: CellExplorerRecordingInterfaceGlobalCopy };
