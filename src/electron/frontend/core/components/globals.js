import { css } from "lit";
import { getRandomString } from "../../utils/random";

export const errorHue = 0;
export const warningHue = 57;
export const successHue = 110;
export const issueHue = 30;

export const errorSymbol = css`❌`;
export const warningSymbol = css`⚠️`;
export const successSymbol = css`✅`;

export const emojiFontFamily = `"Twemoji Mozilla", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",  "Noto Color Emoji", "EmojiOne Color",  "Android Emoji", sans-serif;`;

export const tempPropertyKey = getRandomString();
export const tempPropertyValueKey = getRandomString();
