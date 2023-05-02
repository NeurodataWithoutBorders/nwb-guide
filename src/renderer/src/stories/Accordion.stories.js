import { Accordion } from "./Accordion";

export default {
    title: "Components/Accordion",
};

const Template = (args) => new Accordion(args);

export const Default = Template.bind({});
Default.args = {
    sections: {
        NWBFile: {
            open: true,
            status: "valid",
            content: "WOOHOO",
            subtitle: "General NWB File Properties",
        },
        Subject: {
            status: "warning",
            content: "OOO",
        },
        Ecephys: {
            status: "error",
            content: "BOO",
        },
        Standard: {
            content: "Whatever you want",
        },
    },
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
