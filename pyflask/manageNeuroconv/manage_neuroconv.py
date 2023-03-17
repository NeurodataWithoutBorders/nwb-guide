from typing import List, Optional
from neuroconv.datainterfaces import SpikeGLXRecordingInterface, PhySortingInterface
from neuroconv import datainterfaces, NWBConverter


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


def get_combined_schema(interface_class_names: List[str]) -> dict:
    """
    Function used to get schema from a CustomNWBConverter that can handle multiple interfaces
    """
    CustomNWBConverter = get_custom_converter(interface_class_names)
    return CustomNWBConverter.get_source_schema()


def get_metadata(source_data):
    """
    Function used to get metadata from a CustomNWBConverter
    """

    interface_class_names = list(source_data) # NOTE: We currently assume that the keys of the properties dict are the interface names
    CustomNWBConverter = get_custom_converter(interface_class_names)
    converter = CustomNWBConverter(source_data)
    return converter.get_metadata_schema()
