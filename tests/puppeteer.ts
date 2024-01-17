
import { afterAll, beforeAll, expect, describe, vi, test } from 'vitest'

import * as puppeteer from 'puppeteer'

import { spawn } from 'child_process'
import { electronDebugPort } from './globals'
import { s } from 'vitest/dist/reporters-5f784f42'

export const sharePort = 1234

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))


const beforeStart = async () => spawn('npm', ['run', 'start']) // Run Start Script from package.json

type BrowserTestOutput = {
  info?: any
  page?: puppeteer.Page,
  browser?: puppeteer.Browser,
}

export const connect = () => {


  const output: BrowserTestOutput = {}


  beforeAll(async () => {

    beforeStart()

    // Ensure Electron will exit gracefully
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        mockExit.mockRestore()
    });


    await sleep(5 * 1000) // Wait for five seconds for Electron to open

    const browserURL = `http://localhost:${electronDebugPort}`
    const browser = output.browser = await puppeteer.launch({ headless: 'new' })
    const page = output.page = await browser.newPage();
    await page.goto(browserURL);
    const endpoint = await page.evaluate(() => fetch(`json/version`).then(res => res.json()).then(res => res.webSocketDebuggerUrl))
    await browser.close()
    delete output.browser
    delete output.page

    await sleep(1000)

    // Connect to browser WS Endpoint
    const browserWSEndpoint = endpoint.replace('localhost', '0.0.0.0')
    output.browser = await puppeteer.connect({ browserWSEndpoint, defaultViewport: null })
    const pages = await output.browser.pages()
    output.page = pages[0]
  })

  afterAll(async () => {
    if (output.browser) await output.browser.close() // Will also exit the Electron instance
  });

  return output

}