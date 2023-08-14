const path = require("path");
const child_process = require("child_process");
const fs = require("fs");

const port = 1234;
const script = path.resolve(
    __dirname,
    `../build/flask/nwb-guide/nwb-guide${process.platform === "win32" ? ".exe" : ""}`
);
console.log("Found file", fs.existsSync(script));

const proc2 = child_process.spawn(`${script}`, [port + 1]);
handleProcess(proc2, "spawn");

let now = Date.now(),
    started;

function handleProcess(proc, id = "process") {
    if (proc != null) {
        // Listen for errors from Python process
        proc.stderr.on("data", function (data) {
            console.error(`[${id}]: ${data}`);
            throw new Error("The distributable pyflask failed to run!");
        });

        proc.stdout.on("data", function (data) {
            if (!started) {
                started = Date.now();
                console.log(`Time to Start: ${(started - now).toFixed(2)}ms`);
            }
            console.error(`[${id}]: ${data}`);
            throw new Error("The distributable pyflask failed to run!");
        });

        proc.on("error", (error) => {
            console.error(`[${id}] error: ${error.message}`);
            throw new Error("The distributable pyflask failed to run!");
        });

        proc.on("close", (code) => {
            console.error(`[${id}] exit: ${code}`);
            throw new Error("The distributable pyflask failed to run!");
        });
    } else console.error("child process failed to start on port" + port);
}
