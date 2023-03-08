import { css } from 'lit';

const useGlobalStyles = (componentCSS, condition, toApply=true) => {

    if (!toApply || !condition) return css([componentCSS])

    const sheets = Object.values(document.styleSheets)
    const selectedSheets = condition instanceof Function ? Object.values(sheets).filter(condition) : sheets
    const rules = selectedSheets.map(sheet => Object.values(sheet.cssRules).map(rule => rule.cssText).join('\n'))
    return css([componentCSS, ...rules])
}

export default useGlobalStyles