import { beforeAll, describe, expect, test } from 'vitest'
import { connect, sleep } from './puppeteer'

import { mkdirSync, existsSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotPath = join(__dirname, 'screenshots')
mkdirSync(screenshotPath, { recursive: true })

import paths from "../paths.config.json" assert { type: "json" };
const guideRootPath = join(homedir(), paths.root)
const testRootPath = join(guideRootPath, '.test')

beforeAll(() => {
  if (existsSync(testRootPath)) rmSync(testRootPath, {recursive: true})
})

describe('E2E Test', () => {

  const references = connect()


  test('Ensure number of test pipelines starts at zero', async () => {
    const page = references.page
    const nPipelines = await page.evaluate(() => document.getElementById('guided-div-resume-progress-cards').children.length)
    await page.screenshot({ path: join(screenshotPath, '01-start.png'), fullPage: true });

    // Assert no pipelines yet
    expect(nPipelines).toBe(0)
  })

  describe('Manually run through the pipeline', async () => {

    test('Create tutorial dataset', async () => {

      const page = references.page

      const outputLocation = await page.evaluate(async () => {

        // Transition to settings page
        const dashboard = document.querySelector('nwb-dashboard')
        dashboard.sidebar.select('settings')
        await new Promise(resolve => setTimeout(resolve, 200))

        // Genereate test data
        const page = dashboard.page
        page.deleteTestData()
        return await page.generateTestData()
      })

      // Take image after dataset generation
      await sleep(500)
      await page.screenshot({ path: join(screenshotPath, '02-dataset-creation.png'), fullPage: true });

      expect(existsSync(outputLocation)).toBe(true)

    }, 2 * 60 * 1000) // Allow two minutes to create dataset

    test.skip('Create new pipeline by specifying a name', async () => {

    })

  })

})
