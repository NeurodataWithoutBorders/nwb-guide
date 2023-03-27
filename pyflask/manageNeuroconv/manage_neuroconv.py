from typing import List, Dict
from neuroconv.datainterfaces import SpikeGLXRecordingInterface, PhySortingInterface
from neuroconv import datainterfaces, NWBConverter

import json
from neuroconv.utils import NWBMetaDataEncoder

import os


def check_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)
        # FILE_ATTRIBUTE_HIDDEN = 0x02
        # ret = ctypes.windll.kernel32.SetFileAttributesW(path, FILE_ATTRIBUTE_HIDDEN)


def get_all_interface_info() -> dict:
    """Format an information structure to be used for selecting interfaces based on modality and technique."""
    # Hard coded for now - eventual goal will be to import this from NeuroConv
    interfaces_by_modality_and_technique = dict(
        ecephys=dict(
            recording=dict(SpikeGLX=SpikeGLXRecordingInterface),
            sorting=dict(Phy=PhySortingInterface),
        )
    )

    interface_info = dict()

    for modality, techniques in interfaces_by_modality_and_technique.items():
        for technique, format_name_to_interface in techniques.items():
            for format_name, interface in format_name_to_interface.items():
                # interface = format_name_to_interface
                interface_info[format_name] = {  # Note in the full scope, format_name won't be unique
                    "modality": modality,
                    "name": interface.__name__,  # Where is this value used in the display?
                    "technique": technique,  # Is this actually necessary anymore?
                }

    return interface_info


# Combine Multiple Interfaces
def get_custom_converter(interface_class_names: List[str]) -> NWBConverter:
    class CustomNWBConverter(NWBConverter):
        data_interface_classes = {interface: getattr(datainterfaces, interface) for interface in interface_class_names}

    return CustomNWBConverter


def instantiate_custom_converter(source_data: Dict[str, str]) -> NWBConverter:
    interface_class_names = list(
        source_data
    )  # NOTE: We currently assume that the keys of the properties dict are the interface names
    CustomNWBConverter = get_custom_converter(interface_class_names)
    return CustomNWBConverter(source_data)


def get_source_schema(interface_class_names: List[str]) -> dict:
    """
    Function used to get schema from a CustomNWBConverter that can handle multiple interfaces
    """
    CustomNWBConverter = get_custom_converter(interface_class_names)
    return CustomNWBConverter.get_source_schema()


def get_metadata_schema(source_data: Dict[str, dict]) -> Dict[str, dict]:
    """
    Function used to fetch the metadata schema from a CustomNWBConverter instantiated from the source_data.
    """

    converter = instantiate_custom_converter(source_data)
    schema = converter.get_metadata_schema()
    metadata = converter.get_metadata()
    return json.loads(json.dumps(dict(results=metadata, schema=schema), cls=NWBMetaDataEncoder))


def convert_to_nwb(info: dict) -> bool:
    """
    Function used to convert the source data to NWB format using the specified metadata.
    """

    nwbfile_path = info["nwbfile_path"]

    runStubTest = ("stub_test" in info) and info["stub_test"]

    # add a subdirectory to a filepath if stub_test is true
    if runStubTest:
        filename = os.path.basename(nwbfile_path)
        dirname = os.path.join(os.path.dirname(nwbfile_path), ".stubs")
        nwbfile_path = os.path.join(dirname, filename)
        check_dir(dirname)

    converter = instantiate_custom_converter(info["source_data"])

    # Assume all interfaces have the same conversion options for now
    options = (
        {interface: {"stub_test": info["stub_test"]} for interface in info["source_data"]} if runStubTest else None
    )

    file = converter.run_conversion(
        metadata=info["metadata"],
        nwbfile_path=nwbfile_path,
        overwrite=info.get("overwrite", False),
        conversion_options=options,
    )

    return str(file)
