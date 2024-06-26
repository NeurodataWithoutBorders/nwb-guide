import { ProgressBar } from "../../src/electron/frontend/core/components/ProgressBar";

export default {
    title: "Components/Progress Bar",
};

const Template = (args) => new ProgressBar(args);

const n = 0;
const total = 50;

export const Default = Template.bind({});
Default.args = {
    format: {
        n,
        total,
    },
};

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

Default.play = async ({ canvasElement }) => {
    const progressBar = canvasElement.querySelector("nwb-progress");
    for (let i = 1; i <= total; i++) {
        await sleep(1000);
        progressBar.format = { n: i, total };
    }
};
