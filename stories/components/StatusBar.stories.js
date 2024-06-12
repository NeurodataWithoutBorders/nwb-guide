import { StatusBar } from "../../src/electron/frontend/core/components/StatusBar";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import pythonSVG from "../../src/electron/frontend/assets/icons/python.svg?raw";
import webAssetSVG from "../../src/electron/frontend/assets/icons/web_asset.svg?raw";
import wifiSVG from "../../src/electron/frontend/assets/icons/wifi.svg?raw";

export default {
    title: "Components/Status Bar",
};

const Template = (args) => new StatusBar(args);

export const Default = Template.bind({});
Default.args = {
    items: [
        { label: unsafeSVG(webAssetSVG), value: "0.0.3" },
        { label: unsafeSVG(wifiSVG) },
        { label: unsafeSVG(pythonSVG), status: true },
        { label: "Other", status: false },
    ],
};

// {
// pages: {
//   'Page 1': {
//     active: true
//   },
//   'Page 2': {
//     active: false
//   },
// }
// }
