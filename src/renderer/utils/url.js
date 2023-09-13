
export function updateURLParams(paramsToUpdate) {
    const params = new URLSearchParams(location.search);
    for (let key in paramsToUpdate) {
        const value = paramsToUpdate[key];
        if (value == undefined) params.delete(key);
        else params.set(key, value);
    }

    // Update browser history state
    const value = `${location.pathname}?${params}`;
    if (history.state) Object.assign(history.state, paramsToUpdate);
    window.history.pushState(history.state, null, value);
}
