from neuroconv.datainterfaces import SpikeGLXRecordingInterface, PhySortingInterface
from neuroconv import NWBConverter


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
                
                interface_info[interface.__name__] = {  # Note in the full scope, format_name won't be unique
                    "modality": modality,
                    "name": format_name,
                    "technique": technique,
                }

    return interface_info

def get_schema(interface):
    """
    Function used to get schema for a single interface
    """

    # Hard coded for now - eventual goal will be to import this from NeuroConv
    interface_list_subset = [SpikeGLXRecordingInterface, PhySortingInterface]
    return [x for x in interface_list_subset if x.__name__ == interface][0].get_source_schema() # Single Interface