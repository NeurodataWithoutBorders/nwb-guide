"""Tests for newly added interfaces that were previously excluded from selection."""

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


NEW_INTERFACE_NAMES = [
    "CsvTimeIntervalsInterface",
    "ExcelTimeIntervalsInterface",
    "Hdf5ImagingInterface",
    "MaxOneRecordingInterface",
    "OpenEphysSortingInterface",
    "AxonaPositionDataInterface",
    "AxonaUnitRecordingInterface",
]

SHOULD_REMAIN_EXCLUDED = [
    "SpikeGLXLFPInterface",
    "CEDRecordingInterface",
    "OpenEphysBinaryRecordingInterface",
    "OpenEphysLegacyRecordingInterface",
    "SimaSegmentationInterface",
]


def get_interface_info():
    from manageNeuroconv.manage_neuroconv import get_all_interface_info

    return get_all_interface_info()


def get_all_interface_class_names(info: dict) -> list:
    """Extract all interface class names from the info dict."""
    return [v["name"] for v in info.values()]


class TestNewInterfacesIncluded:
    """Verify that newly un-excluded interfaces appear in get_all_interface_info()."""

    @pytest.fixture(scope="class")
    def interface_info(self):
        return get_interface_info()

    @pytest.fixture(scope="class")
    def interface_names(self, interface_info):
        return get_all_interface_class_names(interface_info)

    @pytest.mark.parametrize("interface_name", NEW_INTERFACE_NAMES)
    def test_interface_present(self, interface_names, interface_name):
        assert (
            interface_name in interface_names
        ), f"{interface_name} should be present in get_all_interface_info() but was not found"

    @pytest.mark.parametrize("interface_name", SHOULD_REMAIN_EXCLUDED)
    def test_interface_still_excluded(self, interface_names, interface_name):
        assert (
            interface_name not in interface_names
        ), f"{interface_name} should remain excluded but was found in get_all_interface_info()"


class TestNewInterfaceSchemas:
    """Verify that source schemas can be retrieved for each new interface."""

    @pytest.mark.parametrize("interface_name", NEW_INTERFACE_NAMES)
    def test_source_schema(self, interface_name):
        from manageNeuroconv.manage_neuroconv import get_source_schema

        schema = get_source_schema({interface_name: interface_name})
        assert isinstance(schema, dict)
        assert "properties" in schema or "additionalProperties" in schema or "type" in schema
