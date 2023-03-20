import dependencies from './electron/index.js'
const { electron = {} } = dependencies
const { shell } = electron;

export const openLink = (url) => {
    if (shell) shell.openExternal(url);
  else window.open(url, "_blank")
}
