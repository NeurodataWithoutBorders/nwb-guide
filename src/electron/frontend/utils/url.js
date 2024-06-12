export function updateURLParams(paramsToUpdate) {
    const params = new URLSearchParams(location.search);
    for (let key in paramsToUpdate) {
        const value = paramsToUpdate[key];
        if (value == undefined) params.delete(key);
        else params.set(key, value);
    }

    // Update browser history state
    const paramString = params.toString();
    const value = paramString ? `${location.pathname}?${paramString}` : location.pathname;
    if (history.state) {
        Object.entries(paramsToUpdate).forEach(([key, value]) => {
            if (value == undefined) delete history.state[key];
            else history.state[key] = value;
        });
    }

    window.history.pushState(history.state, null, value);
}
