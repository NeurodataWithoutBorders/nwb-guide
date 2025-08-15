
const dandiAPITokenRegex = /^[a-f0-9]{40}$/;

import { validateToken } from 'dandi'

export const validateDANDIApiKey = async (apiKey: string, sandbox = false) => {
    if (apiKey) {

        if (!dandiAPITokenRegex.test(apiKey)) return [{ type: "error", message: `Invalid API key format. Must be a 40 character hexadecimal string` }];

        const authFailedError = {type: 'error', message: `Authorization failed. Make sure you're providing an API key for the <a href='https://${sandbox ? 'sandbox.' : ''}dandiarchive.org' target='_blank'>${sandbox ? 'sandbox' : 'main'} archive</a>.`}

        const isValid = validateToken({ token: apiKey, type: sandbox ? 'sandbox' : undefined }).catch(e => false)
        if (!isValid) return [ authFailedError ]
        return true
    }
}
