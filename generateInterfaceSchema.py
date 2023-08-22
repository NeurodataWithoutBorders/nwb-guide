from pathlib import Path
import json
from neuroconv import datainterfaces, NWBConverter

filepath = Path("guideGlobalMetadata.json")
generatedJSONSchemaPath = Path("schemas", "json", "generated")
generatedJSONSchemaPath.mkdir(exist_ok=True, parents=True)

f = filepath.open()
data = json.load(f)

# Create JSON for the Schema
paths = {}
for interface in data["supported_interfaces"]:
    interface_class_dict = {interface: interface}

    class CustomNWBConverter(NWBConverter):
        data_interface_classes = {
            custom_name: getattr(datainterfaces, interface_name)
            for custom_name, interface_name in interface_class_dict.items()
        }

    schema = CustomNWBConverter.get_source_schema()

    json_object = json.dumps(schema, indent=4)
    paths[interface] = filepath = generatedJSONSchemaPath / f"{interface}.json"
    with open(filepath, "w") as outfile:
        outfile.write(json.dumps(schema, indent=4))


sourceDataStoryPath = Path("src/renderer/src/stories/pages/guided-mode/SourceData.stories.js")

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

const activePage = "conversion/sourcedata"


export const Example = PageTemplate.bind({{}});
Example.args = {{ activePage, globalState }};

{storyCode}
"""
    )
