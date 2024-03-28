import { beforeAll, describe, expect, test } from 'vitest'
import { sleep } from '../puppeteer'

import { mkdirSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

import * as config from './config'
import runWorkflow from './workflow'
import { evaluate, takeScreenshot } from './utils'

beforeAll(() => {

  if (config.regenerateTestData) {
    if (existsSync(config.testDataRootPath)) rmSync(config.testDataRootPath, { recursive: true })
  }

  config.alwaysDelete.forEach(path => existsSync(path) ? rmSync(path, { recursive: true }) : '')

  if (existsSync(config.screenshotPath)) rmSync(config.screenshotPath, { recursive: true })
  mkdirSync(config.screenshotPath, { recursive: true })
})

describe('E2E Test', () => {

  // NOTE: This is where you should be connecting...

  test('Ensure number of test pipelines starts at zero', async () => {

    await sleep(500) // Wait for full notification to render
    const nPipelines = await evaluate(() => document.getElementById('guided-div-resume-progress-cards').children.length)
    await takeScreenshot('home-page')

    // Assert no pipelines yet
    expect(nPipelines).toBe(0)
  })

  describe('Manually run through the pipeline', async () => {

    const datasetTestFunction = config.regenerateTestData ? test : test.skip

    datasetTestFunction('Create tutorial dataset', async () => {

      const x = 250 // Sidebar size
      const width = config.windowDims.width - x

      const screenshotClip = {
        x,
        y: 0,
        width,
        height: 220
      }


      await evaluate(async () => {

        // Transition to settings page
        const dashboard = document.querySelector('nwb-dashboard')
        dashboard.sidebar.select('settings')

        // Generate test data
        const page = dashboard.page
        page.deleteTestData()
      })

      await takeScreenshot('dataset-creation', 300, { clip: screenshotClip })

      const outputLocation = await evaluate(async () => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        const outputLocation = await page.generateTestData()
        page.requestUpdate()
        return outputLocation
      })

      // Take image after dataset generation
      await takeScreenshot('dataset-created', 500, { clip: screenshotClip })

      expect(existsSync(outputLocation)).toBe(true)

      // Navigate back to the home page
      let pageId = await evaluate(() => {
        const dashboard = document.querySelector('nwb-dashboard')
        dashboard.sidebar.select('/')
        return dashboard.page.info.id
      })

      expect(pageId).toBe('/')
    })

    describe('Complete a single-session workflow', async () => {
      const subdirectory = 'single'
      await runWorkflow('Single Session Workflow', { upload_to_dandi: false, multiple_sessions: false, subject_id: 'sub1', session_id: 'ses1' }, subdirectory)

      test('Ensure there is one completed pipeline', async () => {
        await takeScreenshot(join(subdirectory, 'home-page-complete'), 100)
        const nPipelines = await evaluate(() => document.getElementById('guided-div-resume-progress-cards').children.length)
        expect(nPipelines).toBe(1)
      })
    })

    describe('Complete a multi-session workflow', async () => {
      const subdirectory = 'multiple'
      await runWorkflow('Multi Session Workflow', { upload_to_dandi: false, multiple_sessions: true, locate_data: true }, subdirectory)

      test('Ensure there are two completed pipelines', async () => {
        await takeScreenshot(join(subdirectory, 'home-page-complete'), 100)
        const nPipelines = await evaluate(() => document.getElementById('guided-div-resume-progress-cards').children.length)
        expect(nPipelines).toBe(2)
      })  
    })


  })

})
