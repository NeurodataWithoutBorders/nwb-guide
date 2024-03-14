import { ProgressBar } from "./ProgressBar";

export default {
    title: "Components/Progress Bar",
};

const Template = (args) => new ProgressBar(args);

const n = 0;
const total = 50;

export const Default = Template.bind({});
Default.args = {
    value: {
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
        progressBar.value = { n: i, total };
    }
};
