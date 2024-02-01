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

const pipelineDescribeFn = hasTestPath ? describe : describe.skip

describe('E2E Test', () => {

    const references = connect()


    test('Ensure number of test pipelines starts at zero', async () => {
      const page = references.page
      const nPipelines = await page.evaluate(() => document.getElementById('guided-div-resume-progress-cards').children.length)
      await page.screenshot({ path: join(screenshotPath, 'test.png'), fullPage: true });

      // Assert no pipelines yet
      expect(nPipelines).toBe(0)
    })

    pipelineDescribeFn('Generate and run pipeline from YAML file', () => {
    
      test('Can create test pipelines', async ( ) => {
        const page = references.page

        await page.evaluate(async (testDataPath) => {

            // Transition to settings page
            const dashboard = document.querySelector('nwb-dashboard')
            dashboard.sidebar.select('settings')
            await new Promise(resolve => setTimeout(resolve, 200))

            // Genereate test pipelines
            const page = dashboard.page
            const folderInput = page.form.getFormElement(["developer", "testing_data_folder"])
            folderInput.updateData(testDataPath)
            
            const button = folderInput.nextSibling
            await button.onClick()

            page.save()
        }, testDataPath)

        // Take image after pipeline generation
        await page.screenshot({ path: join(screenshotPath, 'generate.png'), fullPage: true });

        // Transiton back to conversions page and count pipelines
        const nPipelines = await page.evaluate(async () => {
          const dashboard = document.querySelector('nwb-dashboard')
          dashboard.sidebar.select('/')
          await new Promise(resolve => setTimeout(resolve, 200))
          return document.getElementById('guided-div-resume-progress-cards').children.length
        })

        // Assert new pipeline count
        expect(nPipelines).toBe(Object.keys(testingSuiteYaml.pipelines).length)

      })

      test.skip('Can navigate entirely through the pipeline without interaction', async ( ) => {
        
      })

    })

    pipelineDescribeFn('Run full pipeline from scratch', () => {

      test.skip('Create a new pipeline by specifying a name', async ( ) => {
        
      })

    })


})
