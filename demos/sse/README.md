# Server Side Events Demo
This demo visualizes events from `tqdm` during a standard HTTP request.

To start the demo, run:
```bash
python3 test_sse_display_of_tqdm.py
```

This will start a Flask server at http://127.0.0.1:8000/. When started, you can click on Ctrl+Click on the link printed on the console to open that page.

Once the page opens, it should automatically connect to the SSE endpoint (`/events`) and send a request to the `tqdm` endpoint (`/tqdm`). While this is returning, you will see the progress of the `tqdm` instance print as a list on the page.
