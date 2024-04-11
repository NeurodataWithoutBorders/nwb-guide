import { LitElement, css } from "lit";
import { JSONSchemaInput } from "../../../../JSONSchemaInput";


const options = [
    {
        name: "Upload Timestamps",
        schema: {
            type: 'string',
            format: 'file',
            description: 'A CSV file containing the timestamps of the recording.'
        }
    },
    {
        name: "Adjust Start Time",
        schema: {
            type: 'number',
            description: 'The start time of the recording in seconds.',
            min: 0
        }
    },
    {
        name: "Link to Recording",
        schema: {
            type: 'string',
            description: 'The name of the linked recording.'
        },
        enum: [],
        strict: true
    }
]

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
        `
    }
    
    static get properties() {
        return {
            results: { type: Object },
        };
    }

    constructor({ results = {} }) {
        super();
        this.results = results;
    }

    render() {
        
        const container = document.createElement("div");

        const results = this.results;
        const flatTimes = Object.values(results)
            .map((interfaceTimestamps) => {
                return [interfaceTimestamps[0], interfaceTimestamps.slice(-1)[0]];
            })
            .flat()
            .filter((timestamp) => !isNaN(timestamp));

        const minTime = Math.min(...flatTimes);
        const maxTime = Math.max(...flatTimes);

        const normalizeTime = (time) => (time - minTime) / (maxTime - minTime);
        const normalizeTimePct = (time) => `${normalizeTime(time) * 100}%`;

        for (let name in results) {

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

            const data = results[name];

            const barContainer = document.createElement("div");
            Object.assign(barContainer.style, {
                height: "10px",
                width: "100%",
                marginTop: "5px",
                border: "1px solid lightgray",
                position: "relative",
            });

            barCell.append(barContainer);


            const hasData = data.length > 0;

            if (hasData) {
                const firstTime = data[0];
                const lastTime = data[data.length - 1];

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
                    background: "blue",
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

            const optionsCopy = structuredClone(options);

            options[2].schema.enum = Object.keys(results).filter(str => str.includes('Recording'))

            const resolvedOptions = hasData ? optionsCopy.slice(0, 2) : optionsCopy;

            const elements = resolvedOptions.map((option) => {
                const clickableElement = document.createElement("div");
                clickableElement.innerText = option.name;
                clickableElement.onclick = () => {
                    const element = new JSONSchemaInput({
                        schema: option.schema,
                        path: [ ],
                        controls: option.controls ? option.controls() : [],
                    })

                    resultCell.innerHTML = '';
                    resultCell.append(element)
                }
                return clickableElement;
            })
            
            selectionCell.append(...elements)

            row.append(selectionCell, resultCell);
            elements[0].click();

            // const empty = document.createElement("div");
            // const disclaimer = document.createElement("div");
            // disclaimer.classList.add("disclaimer");
            // disclaimer.innerText = "Edit in Source Data";
            // row.append(disclaimer, empty);

            container.append(row);

        }

        return container

    }
}


customElements.get("nwbguide-time-alignment") ||
    customElements.define("nwbguide-time-alignment", TimeAlignment);
