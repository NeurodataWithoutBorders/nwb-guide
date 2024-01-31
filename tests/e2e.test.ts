import { describe, expect, test } from 'vitest'
import { connect } from './puppeteer'

import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotPath = join( __dirname, 'screenshots')
mkdirSync(screenshotPath, { recursive: true })


describe('E2E Test', () => {

    const references = connect()

    test('Ensure number of test pipelines starts at zero', async () => {
      const page = references.page
      const nPipelines = await page.evaluate(() => document.getElementById('guided-div-resume-progress-cards').children.length)
      await page.screenshot({ path: join(screenshotPath, 'test.png'), fullPage: true });
      expect(nPipelines).toBe(0)
    })

})
