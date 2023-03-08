from neuroconv.datainterfaces import interfaces_by_category
from neuroconv import NWBConverter
import inspect
import os

interfaces = {}
interface_info = {}

for category in interfaces_by_category:
    for name in interfaces_by_category[category]:
        if (name not in interface_info.keys()): 
            interface = interfaces_by_category[category][name]
            interfaces[interface.__name__] = interface
            interface_info[name] = {
                'tags': [], 
                'name': interface.__name__, 
                'category': os.path.basename(os.path.dirname(os.path.dirname(inspect.getfile(interface))))
            }

        info = interface_info[name]
        # if (info.category != category): info['tags'].append(category)
        info['tags'].append(category)
        
def get_all_interface_info() -> dict:
    """
    Function used to get the list of all interfaces
    """
    return interface_info


def get_schema(interface):
    """
    Function used to get schema for a single interface
    """
    if (not interface): interface = interface_info.keys() # get schema for all interfaces

    # Single Interface
    if (isinstance(interface, str)): return interfaces[interface_info[interface]['name']].get_source_schema()
    
    # Combine Multiple Interfaces
    class CustomNWBConverter(NWBConverter):
        data_interface_classes = dict(zip(interface, map(lambda name: interfaces[interface_info[name]['name']], interface)))

    return CustomNWBConverter.get_source_schema()
