from typing import List, Dict
from neuroconv.datainterfaces import SpikeGLXRecordingInterface, PhySortingInterface
from neuroconv import datainterfaces, NWBConverter

import json
from neuroconv.utils import NWBMetaDataEncoder


def get_all_interface_info() -> dict:
    """Format an information structure to be used for selecting interfaces based on modality and technique."""

    # Hard coded for now - eventual goal will be to import this from NeuroConv
    hardcoded_interfaces = dict(
        SpikeGLX=SpikeGLXRecordingInterface,
        Phy=PhySortingInterface
    )

    interface_info = {
        interface.__name__: {
            "keywords": interface.keywords,
            # Once we use the raw neuroconv list, we will want to ensure that the interfaces themselves have a label property
            "label": format_name
            # Can also add a description here if we want to provide more information about the interface
        } for format_name, interface in hardcoded_interfaces.items()
    }

    print(interface_info)
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

    converter = instantiate_custom_converter(info["source_data"])

    converter.run_conversion(
        metadata=info["metadata"],
        nwbfile_path=info["nwbfile_path"],
        # save_to_file=info.save_to_file,
        # overwrite=info.overwrite,
        # conversion_options=info.conversion_options,
        # stub_test=info.stub_test,
    )

    return True
