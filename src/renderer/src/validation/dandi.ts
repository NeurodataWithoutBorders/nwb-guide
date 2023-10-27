
const dandiAPITokenRegex = /^[a-f0-9]{40}$/;


export const validateDANDIApiKey = async (apiKey: string, staging = false) => {
    if (apiKey) {

        if (!dandiAPITokenRegex.test(apiKey)) return [{ type: "error", message: `Invalid API key format. Must be a 40 character hexadecimal string` }];

        const authFailedError = {type: 'error', message: `Authorization failed. Make sure you're providing an API key for the <a href='https://${staging ? 'gui-staging.' : ''}dandiarchive.org' target='_blank'>${staging ? 'staging' : 'main'} archive</a>.`}

        return fetch(`https://api${staging ? '-staging' : ''}.dandiarchive.org/api/auth/token/`, {headers: {Authorization: `token ${apiKey}`}})
        .then((res) => {
            if (!res.ok) return [authFailedError]
            return true
        })
        .catch(() => [authFailedError])
    }
}