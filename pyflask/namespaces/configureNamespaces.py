from flask_restx import Namespace
from enum import Enum


# namespaces enums
class NamespaceEnum(Enum):
    NEUROCONV = "neuroconv"
    STARTUP = "startup"


# namespaces dictionary that is given a namespace name as a key and returns the corresponding namespace object as a value
namespaces = {}


def configure_namespaces():
    """
    Create namespaces for each pysoda file: pysoda ( now manage_datasets), prepare_metadata, etc
    """
    neuroconv_namespace = Namespace(
        NamespaceEnum.NEUROCONV.value,
        description="Routes for handling neuroconv requests",
    )
    namespaces[NamespaceEnum.NEUROCONV] = neuroconv_namespace

    organize_datasets_namespace = Namespace(
        NamespaceEnum.STARTUP.value,
        description="Routes for handling python server startup verification",
    )
    namespaces[NamespaceEnum.STARTUP] = organize_datasets_namespace


def get_namespace(namespace_name):
    return namespaces[namespace_name]
