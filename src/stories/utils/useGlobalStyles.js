import { css } from 'lit';

const useGlobalStyles = (componentCSS, condition) => {
    const styles = Object.values(document.styleSheets).filter(condition)

    if (!styles.length) return componentCSS

    const rules = styles.map(sheet => Object.values(sheet.cssRules).map(rule => rule.cssText).join('\n'))

    return css([componentCSS, ...rules])
}

export default useGlobalStyles
