import asyncio
import os
import random
import sys
import time
from typing import List

from flask import Flask, Response, render_template
from tqdm import tqdm as base_tqdm

SCRIPT_DIR = os.path.dirname(os.path.abspath(os.path.join(__file__, "..", "..", "src", "pyflask")))
sys.path.append(os.path.dirname(SCRIPT_DIR))
from pyflask.manageNeuroconv.info.sse import MessageAnnouncer


class SSEProgress(base_tqdm):
    def update(self, n=1, always_callback=False):
        if super(SSEProgress, self).update(n) or always_callback:
            announcer.announce(self.format_dict)


# Helper Functions for the Demo
async def sleep_func(sleep_duration: float = 1) -> float:
    start_time = time.time()
    await asyncio.sleep(delay=sleep_duration)
    end_time = time.time()
    elapsed_time = end_time - start_time

    return elapsed_time


async def run_multiple_sleeps(sleep_durations: List[float]) -> List[float]:
    tasks = []
    for sleep_duration in sleep_durations:
        task = asyncio.create_task(sleep_func(sleep_duration=sleep_duration))
        tasks.append(task)

    actual_sleep_durations = [await f for f in SSEProgress(asyncio.as_completed(tasks), total=len(tasks))]

    return actual_sleep_durations


announcer = MessageAnnouncer()

app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")


def listen():
    messages = announcer.listen()  # returns a queue.Queue
    while True:
        msg = messages.get()  # blocks until a new message arrives
        yield msg


@app.route("/tqdm", methods=["GET"])
def tqdm():
    n = 10**5
    sleep_durations = [random.uniform(0, 5.0) for _ in range(n)]
    asyncio.run(run_multiple_sleeps(sleep_durations=sleep_durations))
    return Response()


@app.route("/events", methods=["GET"])
def events():
    return Response(listen(), mimetype="text/event-stream")


if __name__ == "__main__":
    app.run(port=8000, debug=True)
