import { describe, expect, test, skip } from 'vitest'
import { connect } from './puppeteer'

import { mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { homedir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotPath = join( __dirname, 'screenshots')
mkdirSync(screenshotPath, { recursive: true })

import testingSuiteYaml from "../guide_testing_suite.yml";

import paths from "../paths.config.json" assert { type: "json" };

// NOTE: We assume the user has put the GIN data in ~/NWB_GUIDE/test-data
const guideRootPath = join(homedir(), paths.root)
const testDataPath = join(guideRootPath, 'test-data')

const hasTestPath = existsSync(testDataPath)

describe('E2E Test', () => {

    const references = connect()


    test('Ensure number of test pipelines starts at zero', async () => {
      const page = references.page
      const nPipelines = await page.evaluate(() => document.getElementById('guided-div-resume-progress-cards').children.length)
      await page.screenshot({ path: join(screenshotPath, 'test.png'), fullPage: true });

      // Assert no pipelines yet
      expect(nPipelines).toBe(0)
    })

    describe('Generate tutorial data and manually run through the pipeline', () => {

      test.skip('Create tutorial dataset', async ( ) => {
        
      })

      test.skip('Create new pipeline by specifying a name', async ( ) => {

      })

    })

})