import { LitElement, css } from "lit";
import { JSONSchemaInput } from "../../../../JSONSchemaInput";
import { errorHue } from "../../../../globals";
import { InspectorListItem } from "../../../../preview/inspector/InspectorList";

const options = {
    timestamps: {
        name: "Upload Timestamps",
        schema: {
            type: "string",
            format: "file",
            description: "A CSV file containing the timestamps of the recording.",
        },
    },
    start: {
        name: "Adjust Start Time",
        schema: {
            type: "number",
            description: "The start time of the recording in seconds.",
            min: 0,
        },
    },
    linked: {
        name: "Link to Recording",
        schema: {
            type: "string",
            description: "The name of the linked recording.",
            placeholder: "Select a recording interface",
            enum: [],
            strict: true,
        },
    },
};

export class TimeAlignment extends LitElement {
    static get styles() {
        return css`
            * {
                box-sizing: border-box;
            }

            :host {
                display: block;
                padding: 20px;
            }

            :host > div {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            :host > div > div {
                display: flex;
                align-items: center;
                gap: 20px;
            }

            :host > div > div > *:nth-child(1) {
                width: 100%;
            }

            :host > div > div > *:nth-child(2) {
                display: flex;
                flex-direction: column;
                justify-content: center;
                white-space: nowrap;
                font-size: 90%;
                min-width: 150px;
            }

            :host > div > div > *:nth-child(2) > div {
                cursor: pointer;
                padding: 5px 10px;
                border: 1px solid lightgray;
            }

            :host > div > div > *:nth-child(3) {
                width: 700px;
            }

            .disclaimer {
                font-size: 90%;
                color: gray;
            }

            label {
                font-weight: bold;
            }

            [selected] {
                font-weight: bold;
                background: whitesmoke;
            }
        `;
    }

    static get properties() {
        return {
            data: { type: Object },
        };
    }

    constructor({ data = {}, results = {}, interfaces = {} }) {
        super();
        this.data = data;
        this.results = results;
        this.interfaces = interfaces;
    }

    render() {
        const container = document.createElement("div");

        const { timestamps, errors } = this.data;

        const flatTimes = Object.values(timestamps)
            .map((interfaceTimestamps) => {
                return [interfaceTimestamps[0], interfaceTimestamps.slice(-1)[0]];
            })
            .flat()
            .filter((timestamp) => !isNaN(timestamp));

        const minTime = Math.min(...flatTimes);
        const maxTime = Math.max(...flatTimes);

        const normalizeTime = (time) => (time - minTime) / (maxTime - minTime);
        const normalizeTimePct = (time) => `${normalizeTime(time) * 100}%`;

        const cachedErrors = {};

        console.log(timestamps);
        for (let name in timestamps) {
            cachedErrors[name] = {};

            if (!(name in this.results))
                this.results[name] = {
                    selected: undefined,
                    values: {},
                };

            const row = document.createElement("div");
            // Object.assign(row.style, {
            //     display: 'flex',
            //     alignItems: 'center',
            //     justifyContent: 'space-between',
            //     gap: '10px',
            // });

            const barCell = document.createElement("div");

            const label = document.createElement("label");
            label.innerText = name;
            barCell.append(label);

            const info = timestamps[name];

            const barContainer = document.createElement("div");
            Object.assign(barContainer.style, {
                height: "10px",
                width: "100%",
                marginTop: "5px",
                border: "1px solid lightgray",
                position: "relative",
            });

            barCell.append(barContainer);

            const interfaceName = this.interfaces[name];

            const isSortingInterface = interfaceName && interfaceName.includes("Sorting");

            // Render this way if the interface has data
            if (info.length > 0) {
                const firstTime = info[0];
                const lastTime = info[info.length - 1];

                const smallLabel = document.createElement("small");
                smallLabel.innerText = `${firstTime.toFixed(2)} - ${lastTime.toFixed(2)} sec`;

                const firstTimePct = normalizeTimePct(firstTime);
                const lastTimePct = normalizeTimePct(lastTime);

                const width = `calc(${lastTimePct} - ${firstTimePct})`;

                const bar = document.createElement("div");

                Object.assign(bar.style, {
                    position: "absolute",
                    left: firstTimePct,
                    width: width,
                    height: "100%",
                    background: "#029CFD",
                });

                barContainer.append(bar);
                barCell.append(smallLabel);
            } else {
                barContainer.style.background =
                    "repeating-linear-gradient(45deg, lightgray, lightgray 10px, white 10px, white 20px)";
            }

            row.append(barCell);

            const selectionCell = document.createElement("div");
            const resultCell = document.createElement("div");

            const optionsCopy = Object.entries(structuredClone(options));

            optionsCopy[2][1].schema.enum = Object.keys(timestamps).filter((str) =>
                this.interfaces[str].includes("Recording")
            );

            const resolvedOptionEntries = isSortingInterface ? optionsCopy : optionsCopy.slice(0, 2);

            const elements = resolvedOptionEntries.reduce((acc, [selected, option]) => {
                const optionResults = this.results[name];

                const clickableElement = document.createElement("div");
                clickableElement.innerText = option.name;
                clickableElement.onclick = () => {
                    optionResults.selected = selected;

                    Object.values(elements).forEach((el) => el.removeAttribute("selected"));
                    clickableElement.setAttribute("selected", "");

                    const element = new JSONSchemaInput({
                        value: optionResults.values[selected],
                        schema: option.schema,
                        path: [],
                        controls: option.controls ? option.controls() : [],
                        onUpdate: (value) => (optionResults.values[selected] = value),
                    });

                    resultCell.innerHTML = "";
                    resultCell.append(element);

                    const errorMessage = cachedErrors[name][selected];
                    if (errorMessage) {
                        const error = new InspectorListItem({
                            type: "error",
                            message: `<h4 style="margin:0;">Alignment Failed</h4><span>${errorMessage}</span>`,
                        });

                        error.style.marginTop = "5px";
                        resultCell.append(error);
                    }
                };

                acc[selected] = clickableElement;
                return acc;
            }, {});

            const elArray = Object.values(elements);
            selectionCell.append(...elArray);

            const selected = this.results[name].selected;
            if (errors[name]) cachedErrors[name][selected] = errors[name];

            row.append(selectionCell, resultCell);
            if (selected) elements[selected].click();
            else elArray[0].click();

            // const empty = document.createElement("div");
            // const disclaimer = document.createElement("div");
            // disclaimer.classList.add("disclaimer");
            // disclaimer.innerText = "Edit in Source Data";
            // row.append(disclaimer, empty);

            container.append(row);
        }

        return container;
    }
}

customElements.get("nwbguide-time-alignment") || customElements.define("nwbguide-time-alignment", TimeAlignment);
