import { beforeAll, describe, expect, test } from 'vitest'
import { connect, sleep } from './puppeteer'

import { mkdirSync, existsSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

import paths from "../paths.config.json" assert { type: "json" };
const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotPath = join(__dirname, 'screenshots')
const guideRootPath = join(homedir(), paths.root)
const testRootPath = join(guideRootPath, '.test')
const testPipelinePath = join(testRootPath, 'pipelines')

const testInterfaceInfo = {
  SpikeGLXRecordingInterface: {
    format: '{subject_id}/{subject_id}_{session_id}/{subject_id}_{session_id}_g0/{subject_id}_{session_id}_g0_imec0/{subject_id}_{session_id}_g0_t0.imec0.ap.bin'
  },
  PhySortingInterface: {
    format: '{subject_id}/{subject_id}_{session_id}/{subject_id}_{session_id}_phy'
  }
}

const regenerateTestData = false


beforeAll(() => {

  if (regenerateTestData) {
    if (existsSync(testRootPath)) rmSync(testRootPath, {recursive: true})
  } else {
    if (existsSync(testPipelinePath)) rmSync(testPipelinePath, {recursive: true})
  }

  if (existsSync(screenshotPath)) rmSync(screenshotPath, {recursive: true})
  mkdirSync(screenshotPath, { recursive: true })
})

describe('E2E Test', () => {

  const references = connect()

  let nScreenshots = 0
  async function takeScreenshot(label, delay = 0) {
    if (delay) await sleep(delay)
    await references.page.screenshot({ path: join(screenshotPath, `${nScreenshots}-${label}.png`), fullPage: true });
    nScreenshots++
  }


  test('Ensure number of test pipelines starts at zero', async () => {
    const page = references.page

    await sleep(500) // Wait for full notification to render
    const nPipelines = await page.evaluate(() => document.getElementById('guided-div-resume-progress-cards').children.length)
    await takeScreenshot('home-page')

    // Assert no pipelines yet
    expect(nPipelines).toBe(0)
  })

  describe('Manually run through the pipeline', async () => {

    const datasetTestFunction = regenerateTestData ? test : test.skip

    datasetTestFunction('Create tutorial dataset', async () => {

      const page = references.page

      const outputLocation = await page.evaluate(async () => {

        // Transition to settings page
        const dashboard = document.querySelector('nwb-dashboard')
        dashboard.sidebar.select('settings')

        // Genereate test data
        const page = dashboard.page
        page.deleteTestData()
        return await page.generateTestData()
      })

      // Take image after dataset generation
      await takeScreenshot('dataset-creation', 500)

      expect(existsSync(outputLocation)).toBe(true)

    }, 2 * 60 * 1000) // Allow two minutes to create dataset

    test('Create new pipeline by specifying a name', async () => {

      const page = references.page

      // Ensure you are on the home page
      let pageId = await page.evaluate(() => {
        const dashboard = document.querySelector('nwb-dashboard')
        dashboard.sidebar.select('/')
        return dashboard.page.info.id
      })

      expect(pageId).toBe('/')

      // Advance to instructions page
      pageId = await page.evaluate(async () => {
        const dashboard = document.querySelector('nwb-dashboard')
        await dashboard.next() // Advance one page
        return dashboard.page.info.id
      })

      await takeScreenshot('intro-page', 300)
      expect(pageId).toBe('//start')

      // Advance to general information page
      pageId = await page.evaluate(async () => {
        const dashboard = document.querySelector('nwb-dashboard')
        await dashboard.next() // Advance one page
        return dashboard.page.info.id
      })

      await takeScreenshot('info-page', 300)
      expect(pageId).toBe('//details')


       // Fail to advance without name
       pageId = await page.evaluate(async () => {
        const dashboard = document.querySelector('nwb-dashboard')
        await dashboard.next() // Advance one page
        return dashboard.page.info.id
      })

      expect(pageId).toBe('//details')

      await takeScreenshot('fail-name', 500)

      // Fill in name of the test pipeline
      await page.evaluate(() => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        page.dismiss() // Dismiss all internal notifications

        const nameInput = page.form.getFormElement([ 'name' ])
        nameInput.updateData('My Test Pipeline')
      })

      await sleep(300) // Wait to render
      await takeScreenshot('valid-name', 300)

      // Advance to formats page
      pageId = await page.evaluate(async () => {
        const dashboard = document.querySelector('nwb-dashboard')
        await dashboard.next() // Advance one page
        return dashboard.page.info.id
      })

      expect(pageId).toBe('//structure')

    }, 10 * 1000)

    test('Specify data formats', async () => {

      const page = references.page

      await takeScreenshot('formats-page', 300)

      await page.evaluate(() => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        page.addButton.onClick()
      })

      await takeScreenshot('format-options', 1000)

      await page.evaluate(() => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        page.search.value = 'SpikeGLX'
      })

      await takeScreenshot('search-behavior')

      await page.evaluate((interfaces) => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        const [ name, info ] = Object.entries(interfaces)[0]
        page.list.add({ key: name, value: name });
        page.searchModal.toggle(false);
      }, testInterfaceInfo)

      await takeScreenshot('interface-added', 1000)

      await page.evaluate((interfaces) => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        Object.keys(interfaces).slice(1).forEach(name => page.list.add({ key: name, value: name }))
      }, testInterfaceInfo)

      await takeScreenshot('all-interfaces-added')

      const pageId = await page.evaluate(async () => {
        const dashboard = document.querySelector('nwb-dashboard')
        await dashboard.next() // Advance one page
        return dashboard.page.info.id
      })

      expect(pageId).toBe('//locate')


    }, 10 * 1000)

    test('Locate all your source data programmatically', async () => {
      const page = references.page

      await takeScreenshot('pathexpansion-page', 300)

      await page.evaluate(async (interfaces) => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        page.optional.yes.onClick()

        Object.values(page.form.accordions).forEach(accordion => accordion.toggle(true))

      }, testInterfaceInfo)

      await takeScreenshot('pathexpansion-selected')

      // Fill out the path expansion information
      await page.evaluate((interfaceInfo, basePath) => {
        const dashboard = document.querySelector('nwb-dashboard')
        const form = dashboard.page.form

        Object.entries(interfaceInfo).forEach(([ name, info ]) => {
          const baseInput = form.getFormElement([ name, 'base_directory' ])
          baseInput.updateData(basePath)

          const formatInput = form.getFormElement([ name, 'format_string_path' ])
          formatInput.updateData(info.format)
        })

        dashboard.main.querySelector('main > section').scrollTop = 100

      },
      testInterfaceInfo,
      join(testRootPath, 'test-data', 'dataset')
      )


      await takeScreenshot('pathexpansion-completed', 300)

      const pageId = await page.evaluate(async () => {
        const dashboard = document.querySelector('nwb-dashboard')
        await dashboard.next() // Advance one page
        return dashboard.page.info.id
      })

      expect(pageId).toBe('//subjects')
    })


    test('Provide subject information', async () => {
      const page = references.page

      await takeScreenshot('subject-page', 300)

    })


  })

})
