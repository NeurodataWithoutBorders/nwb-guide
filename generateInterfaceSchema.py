import json
from pathlib import Path

from neuroconv import NWBConverter, converters, datainterfaces

filepath = Path("src") / "supported_interfaces.json"
generatedJSONSchemaPath = Path("schemas", "json", "generated")
generatedJSONSchemaPath.mkdir(exist_ok=True, parents=True)

f = filepath.open()
supported_interfaces = json.load(f)

# Create JSON for the Schema
paths = {}
for interface in supported_interfaces:
    interface_class_dict = {interface: interface}

    class CustomNWBConverter(NWBConverter):
        data_interface_classes = {
            custom_name: getattr(datainterfaces, interface_name, getattr(converters, interface_name, None))
            for custom_name, interface_name in interface_class_dict.items()
        }

    schema = CustomNWBConverter.get_source_schema()

    json_object = json.dumps(schema, indent=4)
    paths[interface] = filepath = generatedJSONSchemaPath / f"{interface}.json"
    with open(filepath, "w") as outfile:
        outfile.write(json.dumps(schema, indent=4))


sourceDataStoryPath = Path("src/electron/renderer/src/stories/pages/guided-mode/SourceData.stories.js")

importCode = "\n".join(map(lambda arr: f"import {arr[0]}Schema from '../../../../../../{arr[1]}'", paths.items()))
storyCode = "\n".join(
    map(
        lambda arr: f"""export const {arr[0]} = PageTemplate.bind({{}});
const {arr[0]}GlobalCopy = JSON.parse(JSON.stringify(globalState))
{arr[0]}GlobalCopy.interfaces.interface = {arr[0]}
{arr[0]}GlobalCopy.schema.source_data = {arr[0]}Schema
{arr[0]}.args = {{ activePage, globalState: {arr[0]}GlobalCopy }};
""",
        paths.items(),
    )
)


allInterfaceCode = "\n".join(
    map(
        lambda arr: f"globalStateCopy.schema.source_data.properties.{arr[0]} = {arr[0]}Schema.properties.{arr[0]}",
        paths.items(),
    )
)

setDummyPathCode = f"""
const results = globalStateCopy.results
for (let sub in results){{
    for (let ses in results[sub]) results[sub][ses].source_data = {{{list(paths.keys())[1]}: {{file_path: '/dummy/file/path'}}}}
}}
"""

with open(sourceDataStoryPath, "w") as outfile:
    outfile.write(
        f"""import {{ globalState, PageTemplate }} from "./storyStates";
{importCode}

export default {{
    title: "Pages/Guided Mode/Source Data",
    parameters: {{
        chromatic: {{ disableSnapshot: false }},
    }}
}};

const activePage = "//sourcedata"


const globalStateCopy = JSON.parse(JSON.stringify(globalState))
{allInterfaceCode}
{setDummyPathCode}

export const All = PageTemplate.bind({{}});
All.args = {{ activePage, globalState: globalStateCopy }};

{storyCode}
"""
    )
