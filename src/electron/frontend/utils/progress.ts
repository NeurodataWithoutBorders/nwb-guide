import { baseUrl } from "../core/server/globals";

const progressEventsUrl = new URL("/neuroconv/events/progress", baseUrl).href;

type OnOpenCallback = () => void;
type OnMessageCallback = (event: MessageEvent) => void;
type OnErrorCallback = (event: Event) => void;

type ProgressHandlerProps = {
    url: string;
    onopen?: OnOpenCallback;
    onmessage?: OnMessageCallback;
    onerror?: OnErrorCallback;
}

class ProgressHandler {

    source: EventSource;

    onopen: OnOpenCallback  = () => {};
    onmessage: OnMessageCallback = () => {};
    onerror: OnErrorCallback = () => {};

    constructor(props: ProgressHandlerProps) {
        const { url, ...otherProps } = props;

        const source = (this.source = new EventSource(url));
        Object.assign(this, otherProps);

        source.addEventListener("error", this.onerror, false);

        source.addEventListener("open", () => this.onopen(), false);

        source.addEventListener("message", this.onmessage, false);
    }

    addEventListener = (type: string, listener: any, options?: any) => this.source.addEventListener(type, listener, options);
    removeEventListener = (type: string, listener: any, options?: any) => this.source.removeEventListener(type, listener, options);
}

// Create a single global instance of ProgressHandler
const progressHandler = new ProgressHandler({ url: progressEventsUrl });
export default progressHandler
