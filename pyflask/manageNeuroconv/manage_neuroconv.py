"""Collection of utility functions used by the NeuroConv Flask API."""
import os
import json
import math
from datetime import datetime
from typing import Dict, Optional  # , List, Union # TODO: figure way to add these back in without importing other class
from shutil import rmtree, copytree
from pathlib import Path

from sse import MessageAnnouncer
from .info import STUB_SAVE_FOLDER_PATH, CONVERSION_SAVE_FOLDER_PATH, TUTORIAL_SAVE_FOLDER_PATH

announcer = MessageAnnouncer()


def replace_nan_with_none(data):
    if isinstance(data, dict):
        # If it's a dictionary, iterate over its items and replace NaN values with None
        return {key: replace_nan_with_none(value) for key, value in data.items()}
    elif isinstance(data, list):
        # If it's a list, iterate over its elements and replace NaN values with None
        return [replace_nan_with_none(item) for item in data]
    elif isinstance(data, (float, int)) and (data != data):
        return None  # Replace NaN with None
    else:
        return data


def resolve_references(schema, root_schema=None):
    """
    Recursively resolve references in a JSON schema based on the root schema.

    Args:
        schema (dict): The JSON schema to resolve.
        root_schema (dict): The root JSON schema.

    Returns:
        dict: The resolved JSON schema.
    """
    from jsonschema import RefResolver

    if root_schema is None:
        root_schema = schema

    if "$ref" in schema:
        resolver = RefResolver.from_schema(root_schema)
        return resolver.resolve(schema["$ref"])[1]

    if "properties" in schema:
        for key, prop_schema in schema["properties"].items():
            schema["properties"][key] = resolve_references(prop_schema, root_schema)

    if "items" in schema:
        schema["items"] = resolve_references(schema["items"], root_schema)

    return schema


def replace_none_with_nan(json_object, json_schema):
    import math
    import copy

    """
    Recursively search a JSON object and replace None values with NaN where appropriate.

    Args:
        json_object (dict): The JSON object to search and modify.
        json_schema (dict): The JSON schema to validate against.

    Returns:
        dict: The modified JSON object with None values replaced by NaN.
    """

    def replace_none_recursive(obj, schema):
        if isinstance(obj, dict):
            for key, value in obj.items():
                if key in schema.get("properties", {}):
                    prop_schema = schema["properties"][key]
                    if prop_schema.get("type") == "number" and value is None:
                        obj[key] = math.nan
                    else:
                        replace_none_recursive(value, prop_schema)
        elif isinstance(obj, list):
            for item in obj:
                replace_none_recursive(item, schema.get("items", {}))

        return obj

    return replace_none_recursive(copy.deepcopy(json_object), resolve_references(copy.deepcopy(json_schema)))


def locate_data(info: dict) -> dict:
    """Locate data from the specifies directories using fstrings."""
    from neuroconv.tools import LocalPathExpander

    expander = LocalPathExpander()

    # Transform the input into a list of dictionaries
    for value in info.values():
        if (value.get("base_directory") is not None) and (value.get("base_directory") != ""):
            value["base_directory"] = Path(value["base_directory"])

    out = expander.expand_paths(info)

    # Organize results by subject, session, and data type
    organized_output = {}
    for item in out:
        subject_id = item["metadata"]["Subject"]["subject_id"]
        session_id = item["metadata"]["NWBFile"]["session_id"]
        if subject_id not in organized_output:
            organized_output[subject_id] = {}

        if session_id not in organized_output[subject_id]:
            organized_output[subject_id][session_id] = {}

        organized_output[subject_id][session_id] = item

    return organized_output


def get_all_interface_info() -> dict:
    """Format an information structure to be used for selecting interfaces based on modality and technique."""
    from neuroconv.datainterfaces import interface_list

    # Hard coded for now - eventual goal will be to import this from NeuroConv
    interfaces_to_load = {
        interface.__name__.replace("Interface", ""): interface for interface in interface_list
    }  # dict(SpikeGLX=SpikeGLXRecordingInterface, Phy=PhySortingInterface)

    return {
        interface.__name__: {
            "keywords": interface.keywords,
            # Once we use the raw neuroconv list, we will want to ensure that the interfaces themselves
            # have a label property
            "label": format_name
            # Can also add a description here if we want to provide more information about the interface
        }
        for format_name, interface in interfaces_to_load.items()
    }


# Combine Multiple Interfaces
def get_custom_converter(interface_class_dict: dict):  # -> NWBConverter:
    from neuroconv import datainterfaces, NWBConverter

    class CustomNWBConverter(NWBConverter):
        data_interface_classes = {
            custom_name: getattr(datainterfaces, interface_name)
            for custom_name, interface_name in interface_class_dict.items()
        }

    return CustomNWBConverter


def instantiate_custom_converter(source_data, interface_class_dict):  # -> NWBConverter:
    CustomNWBConverter = get_custom_converter(interface_class_dict)
    return CustomNWBConverter(source_data)


def get_source_schema(interface_class_dict: dict) -> dict:
    """Function used to get schema from a CustomNWBConverter that can handle multiple interfaces."""
    CustomNWBConverter = get_custom_converter(interface_class_dict)
    return CustomNWBConverter.get_source_schema()


def get_first_recording_interface(converter):
    from neuroconv.datainterfaces.ecephys.baserecordingextractorinterface import BaseRecordingExtractorInterface

    for interface in converter.data_interface_objects.values():
        if isinstance(interface, BaseRecordingExtractorInterface):
            return interface


def is_supported_recording_interface(recording_interface, metadata):
    """
    Temporary conditioned access to functionality still in development on NeuroConv.

    Used to determine display of ecephys metadata depending on the environment.

    Alpha build release should therefore always return False for this.
    """
    return (
        recording_interface
        and recording_interface.get_electrode_table_json
        and metadata["Ecephys"].get("Electrodes")
        and all(row.get("data_type") for row in metadata["Ecephys"]["Electrodes"])
    )


def get_metadata_schema(source_data: Dict[str, dict], interfaces: dict) -> Dict[str, dict]:
    """Function used to fetch the metadata schema from a CustomNWBConverter instantiated from the source_data."""
    from neuroconv.utils import NWBMetaDataEncoder

    converter = instantiate_custom_converter(source_data, interfaces)
    schema = converter.get_metadata_schema()
    metadata = converter.get_metadata()

    # recording_interface = get_first_recording_interface(converter)

    # if is_supported_recording_interface(recording_interface, metadata):
    #     metadata["Ecephys"]["Electrodes"] = recording_interface.get_electrode_table_json()

    #     # Get Electrode metadata
    #     ecephys_properties = schema["properties"]["Ecephys"]["properties"]
    #     original_electrodes_schema = ecephys_properties["Electrodes"]

    #     new_electrodes_properties = {
    #         properties["name"]: {key: value for key, value in properties.items() if key != "name"}
    #         for properties in original_electrodes_schema["default"]
    #     }

    #     ecephys_properties["Electrodes"] = {
    #         "type": "array",
    #         "minItems": 0,
    #         "items": {
    #             "type": "object",
    #             "properties": new_electrodes_properties,
    #             "additionalProperties": True,  # Allow for new columns
    #         },
    #     }

    #     metadata["Ecephys"]["ElectrodeColumns"] = original_electrodes_schema["default"]
    #     defs = ecephys_properties["definitions"]

    #     ecephys_properties["ElectrodeColumns"] = {"type": "array", "items": defs["Electrodes"]}
    #     ecephys_properties["ElectrodeColumns"]["items"]["required"] = list(defs["Electrodes"]["properties"].keys())
    #     del defs["Electrodes"]

    # # Delete Ecephys metadata if ElectrodeTable helper function is not available
    # else:
    if "Ecephys" in schema["properties"]:
        schema["properties"].pop("Ecephys", dict())

    return json.loads(json.dumps(replace_nan_with_none(dict(results=metadata, schema=schema)), cls=NWBMetaDataEncoder))


def get_check_function(check_function_name: str) -> callable:
    """Function used to fetch an arbitrary NWB Inspector function."""
    from nwbinspector.nwbinspector import configure_checks, load_config

    dandi_check_list = configure_checks(config=load_config(filepath_or_keyword="dandi"))
    dandi_check_registry = {check.__name__: check for check in dandi_check_list}

    check_function: callable = dandi_check_registry.get(check_function_name)
    if check_function is None:
        raise ValueError(f"Function {check_function_name} not found in nwbinspector")

    return check_function


def run_check_function(check_function: callable, arg: dict) -> dict:
    """.Function used to run an arbitrary NWB Inspector function."""
    from nwbinspector.register_checks import InspectorMessage, Importance

    output = check_function(arg)
    if isinstance(output, InspectorMessage):
        if output.importance != Importance.ERROR:
            output.importance = check_function.importance
    elif output is not None:
        for x in output:
            x.importance = check_function.importance

    return output


def validate_subject_metadata(
    subject_metadata: dict, check_function_name: str
):  # -> Union[None, InspectorMessage, List[InspectorMessage]]:
    """Function used to validate subject metadata."""
    from pynwb.file import Subject

    check_function = get_check_function(check_function_name)

    if isinstance(subject_metadata.get("date_of_birth"), str):
        subject_metadata["date_of_birth"] = datetime.fromisoformat(subject_metadata["date_of_birth"])

    return run_check_function(check_function, Subject(**subject_metadata))


def validate_nwbfile_metadata(
    nwbfile_metadata: dict, check_function_name: str
):  # -> Union[None, InspectorMessage, List[InspectorMessage]]:
    """Function used to validate NWBFile metadata."""
    from pynwb.testing.mock.file import mock_NWBFile

    check_function = get_check_function(check_function_name)

    if isinstance(nwbfile_metadata.get("session_start_time"), str):
        nwbfile_metadata["session_start_time"] = datetime.fromisoformat(nwbfile_metadata["session_start_time"])

    return run_check_function(check_function, mock_NWBFile(**nwbfile_metadata))


def validate_metadata(metadata: dict, check_function_name: str) -> dict:
    """Function used to validate data using an arbitrary NWB Inspector function."""
    from pynwb.file import NWBFile, Subject
    from nwbinspector.nwbinspector import InspectorOutputJSONEncoder

    check_function = get_check_function(check_function_name)

    if issubclass(check_function.neurodata_type, Subject):
        result = validate_subject_metadata(metadata, check_function_name)
    elif issubclass(check_function.neurodata_type, NWBFile):
        result = validate_nwbfile_metadata(metadata, check_function_name)
    else:
        raise ValueError(
            f"Function {check_function_name} with neurodata_type {check_function.neurodata_type} "
            "is not supported by this function!"
        )

    return json.loads(json.dumps(result, cls=InspectorOutputJSONEncoder))


def convert_to_nwb(info: dict) -> str:
    """Function used to convert the source data to NWB format using the specified metadata."""

    nwbfile_path = Path(info["nwbfile_path"])
    custom_output_directory = info.get("output_folder")
    project_name = info.get("project_name")
    run_stub_test = info.get("stub_test", False)

    default_output_base = STUB_SAVE_FOLDER_PATH if run_stub_test else CONVERSION_SAVE_FOLDER_PATH
    default_output_directory = default_output_base / project_name

    run_stub_test = info.get("stub_test", False)

    # add a subdirectory to a filepath if stub_test is true
    resolved_output_base = Path(custom_output_directory) if custom_output_directory else default_output_base
    resolved_output_directory = resolved_output_base / project_name
    resolved_output_path = resolved_output_directory / nwbfile_path

    # Remove symlink placed at the default_output_directory if this will hold real data
    if (
        not run_stub_test
        and resolved_output_directory == default_output_directory
        and default_output_directory.is_symlink()
    ):
        default_output_directory.unlink()

    resolved_output_path.parent.mkdir(exist_ok=True, parents=True)  # Ensure all parent directories exist

    converter = instantiate_custom_converter(info["source_data"], info["interfaces"])

    def update_conversion_progress(**kwargs):
        announcer.announce(dict(**kwargs, nwbfile_path=nwbfile_path), "conversion_progress")

    # Assume all interfaces have the same conversion options for now
    available_options = converter.get_conversion_options_schema()
    options = (
        {
            interface: {"stub_test": info["stub_test"]}  # , "iter_opts": {"report_hook": update_conversion_progress}}
            if available_options.get("properties").get(interface).get("properties").get("stub_test")
            else {}
            for interface in info["source_data"]
        }
        if run_stub_test
        else None
    )

    # Update the first recording interface with Ecephys table data
    # This will be refactored after the ndx-probe-interface integration
    # recording_interface = get_first_recording_interface(converter)

    if "Ecephys" not in info["metadata"]:
        info["metadata"].update(Ecephys=dict())

    resolved_metadata = replace_none_with_nan(
        info["metadata"], converter.get_metadata_schema()
    )  # Ensure Ophys NaN values are resolved

    # if is_supported_recording_interface(recording_interface, info["metadata"]):
    #     electrode_column_results = ecephys_metadata["ElectrodeColumns"]
    #     electrode_results = ecephys_metadata["Electrodes"]

    #     recording_interface.update_electrode_table(
    #         electrode_table_json=electrode_results, electrode_column_info=electrode_column_results
    #     )

    #     # Update with the latest metadata for the electrodes
    #     ecephys_metadata["Electrodes"] = electrode_column_results

    # ecephys_metadata.pop("ElectrodeColumns", dict())

    # Actually run the conversion
    converter.run_conversion(
        metadata=resolved_metadata,
        nwbfile_path=resolved_output_path,
        overwrite=info.get("overwrite", False),
        conversion_options=options,
    )

    # Create a symlink between the fake adata and custom data
    if not run_stub_test and not resolved_output_directory == default_output_directory:
        if default_output_directory.exists():
            # If default default_output_directory is not a symlink, delete all contents and create a symlink there
            if not default_output_directory.is_symlink():
                rmtree(default_output_directory)

            # If the location is already a symlink, but points to a different output location
            # remove the existing symlink before creating a new one
            elif (
                default_output_directory.is_symlink()
                and default_output_directory.readlink() is not resolved_output_directory
            ):
                default_output_directory.unlink()

        # Create a pointer to the actual conversion outputs
        if not default_output_directory.exists():
            os.symlink(resolved_output_directory, default_output_directory)

    return dict(file=str(resolved_output_path))


def upload_folder_to_dandi(
    dandiset_id: str,
    api_key: str,
    nwb_folder_path: Optional[str] = None,
    staging: Optional[bool] = None,  # Override default staging=True
    cleanup: Optional[bool] = None,
):
    from neuroconv.tools.data_transfers import automatic_dandi_upload

    os.environ["DANDI_API_KEY"] = api_key  # Update API Key

    return automatic_dandi_upload(
        dandiset_id=dandiset_id,
        nwb_folder_path=Path(nwb_folder_path),
        staging=staging,
        cleanup=cleanup,
    )


def upload_to_dandi(
    dandiset_id: str,
    api_key: str,
    project: Optional[str] = None,
    staging: Optional[bool] = None,  # Override default staging=True
    cleanup: Optional[bool] = None,
):
    from neuroconv.tools.data_transfers import automatic_dandi_upload

    os.environ["DANDI_API_KEY"] = api_key  # Update API Key

    return automatic_dandi_upload(
        dandiset_id=dandiset_id,
        nwb_folder_path=CONVERSION_SAVE_FOLDER_PATH / project,  # Scope valid DANDI upload paths to GUIDE projects
        staging=staging,
        cleanup=cleanup,
    )


# Create an events endpoint
def listen_to_neuroconv_events():
    messages = announcer.listen()  # returns a queue.Queue
    while True:
        msg = messages.get()  # blocks until a new message arrives
        yield msg


def generate_dataset(test_data_directory_path: str):
    base_path = Path(test_data_directory_path)
    output_directory = TUTORIAL_SAVE_FOLDER_PATH / "Dataset"

    if TUTORIAL_SAVE_FOLDER_PATH.exists():
        rmtree(TUTORIAL_SAVE_FOLDER_PATH)

    subjects = ["mouse1", "mouse2"]

    sessions = ["070623", "060623"]

    base_id = "Noise4Sam"

    for subject in subjects:
        for session in sessions:
            full_id = f"{subject}_{session}"
            session_output_directory = output_directory / subject / full_id
            spikeglx_base_directory = base_path / "spikeglx" / f"{base_id}_g0"
            phy_base_directory = base_path / "phy" / "phy_example_0"

            # phy_base_directory.symlink_to(session_output_directory / f'{full_id}_phy', True)

            spikeglx_output_dir = session_output_directory / f"{full_id}_g0"
            phy_output_dir = session_output_directory / f"{full_id}_phy"

            copytree(spikeglx_base_directory, spikeglx_output_dir)

            # Rename directories
            for root, dirs, files in os.walk(spikeglx_output_dir):
                for dir in dirs:
                    if base_id in dir:
                        os.rename(os.path.join(root, dir), os.path.join(root, dir.replace(base_id, full_id)))

            # Rename files
            for root, dirs, files in os.walk(spikeglx_output_dir):
                for file in files:
                    if base_id in file:
                        os.rename(os.path.join(root, file), os.path.join(root, file.replace(base_id, full_id)))

            phy_output_dir.symlink_to(phy_base_directory, True)

    return {"output_directory": str(output_directory)}
