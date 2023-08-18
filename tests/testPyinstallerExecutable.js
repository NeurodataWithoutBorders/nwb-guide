const path = require("path");
const child_process = require("child_process");
const fs = require("fs");

const port = 1234;
const script =
    process.argv[2] ||
    path.resolve(__dirname, `../build/flask/nwb-guide/nwb-guide${process.platform === "win32" ? ".exe" : ""}`);

console.log("Found file", fs.existsSync(script));

const proc2 = child_process.spawn(`${script}`, [port + 1]);
handleProcess(proc2, "spawn");

let now = Date.now();

let outputCollection = '';

const regex = /.+Error: .+/

function handleProcess(proc, id = "process") {
    if (proc != null) {

        // Listen for errors from Python process
        proc.stderr.on("data", function (data) {
            const message = data.toString()
            console.error(`[${id}] Error: ${data}`);
            outputCollection+=message
            if (regex.test(message)) throw new Error(outputCollection);
        });

        proc.stdout.on("data", function (data) {
                console.log(`Time to Start: ${(Date.now() - now).toFixed(2)}ms`);
                process.exit( );
        });

        const error = () => () =>  {
            throw new Error("The distributable pyflask failed to run!");
        }

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
