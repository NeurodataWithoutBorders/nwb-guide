import { beforeAll, describe, expect, test } from 'vitest'
import { sleep } from '../puppeteer'

import { mkdirSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

import * as config from './config'
import runWorkflow, { uploadToDandi } from './workflow'
import { evaluate, takeScreenshot, to, toNextPage } from './utils'

const x = 250 // Sidebar size
const width = config.windowDims.width - x

const datasetScreenshotClip = {
  x,
  y: 0,
  width,
  height: 220
}


beforeAll(() => {

  if (config.regenerateTestData) {
    if (existsSync(config.testDataRootPath)) rmSync(config.testDataRootPath, { recursive: true })
  }

  config.alwaysDelete.forEach(path => existsSync(path) ? rmSync(path, { recursive: true }) : '')

  if (existsSync(config.screenshotPath)) rmSync(config.screenshotPath, { recursive: true })
  mkdirSync(config.screenshotPath, { recursive: true })
})

describe('E2E Test', () => {

  test('Ensure number of test pipelines starts at zero', async () => {

    await sleep(500) // Wait for full notification to render
    const nPipelines = await evaluate(() => document.getElementById('guided-div-resume-progress-cards').children.length)
    await takeScreenshot('home-page')

    // Assert no pipelines yet
    expect(nPipelines).toBe(0)
  })


  const datasetTestFunction = config.regenerateTestData ? test : test.skip

  datasetTestFunction('Create tutorial dataset', async () => {


    await evaluate(async () => {

      // Transition to settings page
      const dashboard = document.querySelector('nwb-dashboard')
      dashboard.sidebar.select('settings')

      // Generate test data
      const page = dashboard.page
      page.deleteTestData()
    })

    await takeScreenshot('dataset-creation', 300, { clip: datasetScreenshotClip })

    const outputLocation = await evaluate(async () => {
      const dashboard = document.querySelector('nwb-dashboard')
      const page = dashboard.page
      const outputLocation = await page.generateTestData()
      page.requestUpdate()
      return outputLocation
    })

    // Take image after dataset generation
    await takeScreenshot('dataset-created', 500, { clip: datasetScreenshotClip })

    expect(existsSync(outputLocation)).toBe(true)

    // Navigate back to the home page
    let pageId = await evaluate(() => {
      const dashboard = document.querySelector('nwb-dashboard')
      dashboard.sidebar.select('/')
      return dashboard.page.info.id
    })

    expect(pageId).toBe('/')
  })

  describe('Run through several pipeline workflows', async () => {

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
      await runWorkflow('Multi Session Workflow', {
        upload_to_dandi: false,
        multiple_sessions: true,
        locate_data: true,
        base_directory: config.testDatasetPath,
      }, subdirectory)

      test('Ensure there are two completed pipelines', async () => {
        await takeScreenshot(join(subdirectory, 'home-page-complete'), 100)
        const nPipelines = await evaluate(() => document.getElementById('guided-div-resume-progress-cards').children.length)
        expect(nPipelines).toBe(2)
      })
    })

    describe('Upload the multi-session output to DANDI', async () => {

      const subdirectory = 'dandi'

      test('Restart pipeline', async () => {

        await evaluate(async () => {
          const pipelines = document.getElementById('guided-div-resume-progress-cards').children
          const found = Array.from(pipelines).find(card => card.info.project.name === 'Multi Session Workflow')
          console.log(found, Array.from(pipelines))
          found.querySelector('button').click()
        })

      })

      test('Update the workflow to allow DANDI upload', async () => {

        await sleep(1000)
        await to('//workflow')

        await evaluate(async ( workflow ) => {
          const dashboard = document.querySelector('nwb-dashboard')
          const page = dashboard.page

          for (let key in workflow) {
            const input = page.form.getFormElement([ key ])
            input.updateData(workflow[key])
          }

          page.form.requestUpdate() // Ensure the form is updated visually

          await page.save()

        }, { upload_to_dandi: true })

        await toNextPage('structure') // Save data without a popup
        await to('//conversion')

        // Do not prompt to save
        await evaluate(() => {
          const dashboard = document.querySelector('nwb-dashboard')
          const page = dashboard.page
          page.unsavedUpdates = false
        })

        await to('//upload') // NOTE: It would be nice to avoid having to re-run the conversion...

      })

      uploadToDandi(subdirectory) // Upload to DANDI if the API key is provided

    })

  })

})
