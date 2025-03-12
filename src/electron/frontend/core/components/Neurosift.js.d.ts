import { LitElement, CSSResult, TemplateResult } from "lit";

export declare function getURLFromFilePath(file: string, projectName: string): string; 

export declare class Neurosift extends LitElement {
    url?: string;
    fullscreen: boolean;

    static get styles(): CSSResult;

    static get properties(): {
        url: { type: typeof String; reflect: true };
    };

    protected render(): TemplateResult | string;
}
