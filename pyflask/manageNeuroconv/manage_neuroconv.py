import neuroconv.datainterfaces as ndi
import inspect
import os
    
interface_keys = list(filter(lambda key: 'Interface' in key, dir(ndi)))
interface_info = list(map(lambda key: {
    'name': key,
    'category': os.path.basename(os.path.dirname(os.path.dirname(inspect.getfile(getattr(ndi, key))))),
}, interface_keys))

interfaces = dict(zip(interface_keys, map(lambda key: getattr(ndi, key), interface_keys)))

# desired_interfaces = ['SpikeGLXRecordingInterface', 'DeepLabCutInterface']

def get_all_interfaces():
    """
    Function used to get the list of all interfaces
    """

    return interface_info


def get_schema(interface):
    """
    Function used to get schema for a single interface
    """

    return interfaces[interface].get_source_schema()

def get_schemas(selected_interfaces):
    """
    Function used to get schema for select interfaces
    """
    if (not selected_interfaces):
        selected_interfaces = interface_keys # get schema for all interfaces

    schema = list(map(lambda name: interfaces[name].get_source_schema(), selected_interfaces))
    return dict(zip(selected_interfaces, schema))
   
