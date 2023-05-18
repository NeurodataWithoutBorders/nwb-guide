import { ProgressBar } from "./ProgressBar";

export default {
    title: "Components/Progress Bar"
};

const Template = (args) => new ProgressBar(args);

const b = 0
const tsize = 50
const bsize = 1

export const Default = Template.bind({});
Default.args = {
    value: {
        b,
        bsize,
        tsize
    }
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

Default.play = async ({ canvasElement }) => {
    const progressBar = canvasElement.querySelector('nwb-progress')
    for (let i = 1; i <= tsize; i++){
        await sleep(1000)
        progressBar.value = { b: i, tsize }
    }
}