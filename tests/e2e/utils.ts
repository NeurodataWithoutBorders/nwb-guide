import { expect } from "vitest"
import { ScreenshotOptions } from 'puppeteer'

import { sleep } from '../puppeteer'

import { mkdirSync, existsSync } from 'node:fs'
import { join, sep } from 'node:path'

import { references, screenshotPath } from "./config"

export const takeScreenshot = async (relativePath, delay = 0, options: ScreenshotOptions = { fullPage: true }) => {
    if (delay) await sleep(delay)

    const splitPath = relativePath.split(sep)
    const subdirectory = splitPath.slice(0, -1).join(sep)
    const label = splitPath.slice(-1)[0]
    const fullScreenshotPath = join(screenshotPath, subdirectory)

    if (!existsSync(fullScreenshotPath)) mkdirSync(fullScreenshotPath, { recursive: true })

    const pathToScreenshot = join(fullScreenshotPath, `${label}.png`)

    if (existsSync(pathToScreenshot)) return console.error(`Screenshot already exists: ${pathToScreenshot}`)


    await references.page.screenshot({ path: pathToScreenshot, ...options });
  }

  export const evaluate = async (...args) => await references.page.evaluate(...args)

  export const toNextPage = async (path?: null | string) => {
    const pageId = await evaluate(async () => {
      const dashboard = document.querySelector('nwb-dashboard')
      await dashboard.page.save() // Ensure always saved
      await dashboard.next() // Advance one page
      return dashboard.page.info.id
    }).catch((e) => {
      console.error('ERROR', e)
      expect(path).toBe(null)
    })

    if (path) expect(pageId).toBe(`//${path}`)

    return pageId

  }

  export const toHome = async () => {
    const pageId = await evaluate(async () => {
      const dashboard = document.querySelector('nwb-dashboard')
      await dashboard.page.to('/')
      return dashboard.page.info.id
    })

    expect(pageId).toBe('/') // Ensure you are on the home page
  }
