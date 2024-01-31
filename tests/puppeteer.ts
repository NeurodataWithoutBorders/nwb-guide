
import { afterAll, beforeAll, expect, describe, vi, test } from 'vitest'

import * as puppeteer from 'puppeteer'

import { spawn } from 'child_process'
import { electronDebugPort } from './globals'

export const sharePort = 1234

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))


const beforeStart = async (startupTime) => {

  console.log('Spawning Electron application')
  const process = spawn('npm', ['run', 'start']) // Run Start Script from package.json
  process.stdout.on('data', (data) =>  console.log(`[electron] ${data}`));
  process.stderr.on('data', (data) => console.error(`[electron] ${data}`));
  process.on('close', (code) => console.log(`[electron] Exited with code ${code}`));
  
  console.log('Waiting for the application to open...')
  await sleep(startupTime) // Wait for five seconds for Electron to open
}

type BrowserTestOutput = {
  info?: any
  page?: puppeteer.Page,
  browser?: puppeteer.Browser,
}

const sleepBeforeQuery = 10 * 1000 // Wait for five seconds for Electron to open

export const connect = () => {


  const output: BrowserTestOutput = {}


  beforeAll(async () => {

    await beforeStart(sleepBeforeQuery)

    // Ensure Electron will exit gracefully
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        mockExit.mockRestore()
    });


    console.log('Deriving Electron Connection Details')

    const browserURL = `http://localhost:${electronDebugPort}`
    const browser = output.browser = await puppeteer.launch({ headless: 'new' })
    const page = output.page = await browser.newPage();
    await page.goto(browserURL);
    const endpoint = await page.evaluate(() => fetch(`json/version`).then(res => res.json()).then(res => res.webSocketDebuggerUrl))
    await browser.close()
    delete output.browser
    delete output.page

    // Connect to browser WS Endpoint
    console.log('Connecting to Electron Instance via Websockets')
    const browserWSEndpoint = endpoint.replace('localhost', '0.0.0.0')
    output.browser = await puppeteer.connect({ browserWSEndpoint, defaultViewport: null })

    console.log('Grabbing the first Electron page')
    const pages = await output.browser.pages()
    output.page = pages[0]

    console.log('Successfully connected to Electron!')

  }, sleepBeforeQuery + 5000)

  afterAll(async () => {
    if (output.browser) await output.browser.close() // Will also exit the Electron instance
  });

  return output

}
