const path = require("path");
const child_process = require("child_process");
const fs = require("fs");

const cmds = {
    port: 1234,
    script: path.resolve(__dirname, `../build/flask/nwb-guide/nwb-guide${process.platform === "win32" ? ".exe" : ""}`),
};

process.argv.forEach((v, i) => {
    if (v === "--script") cmds.script = process.argv[i + 1];
    if (v === "--port") cmds.port = parseInt(process.argv[i + 1]);
    if (v === "--forever") cmds.forever = true;
});

console.log("Found file", fs.existsSync(cmds.script));

const proc2 = child_process.spawn(`${cmds.script}`, {
    env: {
        PORT: cmds.port
    }
});

handleProcess(proc2, "spawn");

let now = Date.now();

const regex = /.+Error: .+/i; // Check for error messages (without case sensitivity)

function onMessage(data, id) {
    const message = data.toString();
    if (!cmds.forever && regex.test(message)) throw new Error(message);
    else console.error(`[${id}] ${message}`);
}

function handleProcess(proc, id = "process") {
    if (proc != null) {
        // Listen for errors from Python process
        proc.stderr.on("data", (data) => onMessage(data, id));

        proc.stdout.on("data", function (data) {
            if (cmds.forever) onMessage(data, id);
            else {
                console.log(`Time to Start: ${(Date.now() - now).toFixed(2)}ms`);
                process.exit();
            }
        });

        const error = () => () => {
            throw new Error("The distributable pyflask failed to run!");
        };

        proc.on("error", (error) => {
            console.error(`[${id}] Error: ${error.message}`);
            error();
        });

        proc.on("close", (code) => {
            console.error(`[${id}] Exit: ${code}`);
            error();
        });
    } else console.error("child process failed to start on port" + port);
}
