import { beforeAll, describe, expect, test } from 'vitest'
import { connect, sleep } from './puppeteer'

import { mkdirSync, existsSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

import paths from "../paths.config.json" assert { type: "json" };

// ------------------------------------------------------------------
// ------------------------ Path Definitions ------------------------
// ------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotPath = join(__dirname, 'screenshots')
const guideRootPath = join(homedir(), paths.root)
const testRootPath = join(guideRootPath, '.test')
const testDataPath = join(testRootPath, 'test-data')

const alwaysDelete = [
  join(testRootPath, 'pipelines'),
  join(testRootPath, 'conversions'),
  join(testRootPath, 'preview'),
  join(testRootPath, 'config.json')
]


// -----------------------------------------------------------------------
// ------------------------ Configuration Options ------------------------
// -----------------------------------------------------------------------

const testInterfaceInfo = {
  SpikeGLXRecordingInterface: {
    format: '{subject_id}/{subject_id}_{session_id}/{subject_id}_{session_id}_g0/{subject_id}_{session_id}_g0_imec0/{subject_id}_{session_id}_g0_t0.imec0.ap.bin'
  },
  PhySortingInterface: {
    format: '{subject_id}/{subject_id}_{session_id}/{subject_id}_{session_id}_phy'
  }
}

const regenerateTestData = !existsSync(testDataPath) || false // Generate only if doesn't exist

const dandiInfo = {
  id: '212750',
  token: process.env.DANDI_STAGING_API_KEY
}

// -------------------------------------------------------
// ------------------------ Tests ------------------------
// -------------------------------------------------------

const skipUpload = dandiInfo.token ? false : true

if (skipUpload) console.log('No DANDI API key provided. Will skip upload step...')

beforeAll(() => {

  if (regenerateTestData) {
    if (existsSync(testDataPath)) rmSync(testDataPath, { recursive: true })
  }

  alwaysDelete.forEach(path => existsSync(path) ? rmSync(path, { recursive: true }) : '')

  if (existsSync(screenshotPath)) rmSync(screenshotPath, { recursive: true })
  mkdirSync(screenshotPath, { recursive: true })
})

describe('E2E Test', () => {

  const references = connect()

  let nScreenshots = 0
  const takeScreenshot = async (label, delay = 0) => {
    if (delay) await sleep(delay)
    await references.page.screenshot({ path: join(screenshotPath, `${nScreenshots}-${label}.png`), fullPage: true });
    nScreenshots++
  }

  const evaluate = async (...args) => await references.page.evaluate(...args)

  const toNextPage = async (path?: null | string) => {
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

  const toHome = async () => {
    const pageId = await evaluate(async () => {
      const dashboard = document.querySelector('nwb-dashboard')
      await dashboard.page.to('/')
      return dashboard.page.info.id
    })

    expect(pageId).toBe('/') // Ensure you are on the home page
  }



  test('Ensure number of test pipelines starts at zero', async () => {

    await sleep(500) // Wait for full notification to render
    const nPipelines = await evaluate(() => document.getElementById('guided-div-resume-progress-cards').children.length)
    await takeScreenshot('home-page')

    // Assert no pipelines yet
    expect(nPipelines).toBe(0)
  })

  describe('Manually run through the pipeline', async () => {

    const datasetTestFunction = regenerateTestData ? test : test.skip

    datasetTestFunction('Create tutorial dataset', async () => {

      const outputLocation = await evaluate(async () => {

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

      // Ensure you are on the home page
      let pageId = await evaluate(() => {
        const dashboard = document.querySelector('nwb-dashboard')
        dashboard.sidebar.select('/')
        return dashboard.page.info.id
      })

      expect(pageId).toBe('/')

      // Advance to instructions page
      await toNextPage('start')

      await takeScreenshot('intro-page', 300)

      // Advance to general information page
      await toNextPage('details')

      await takeScreenshot('info-page', 300)


      // Fail to advance without name
      await toNextPage('details')

      await takeScreenshot('fail-name', 500)

      // Fill in name of the test pipeline
      await evaluate(() => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        page.dismiss() // Dismiss all internal notifications

        const nameInput = page.form.getFormElement(['name'])
        nameInput.updateData('My Test Pipeline')
      })

      await takeScreenshot('valid-name', 300)

      // Advance to formats page
      await toNextPage('structure')

    }, 10 * 1000)

    test('Specify data formats', async () => {

      await takeScreenshot('formats-page', 300)

      await evaluate(() => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        page.addButton.onClick()
      })

      await takeScreenshot('format-options', 1000)

      await evaluate(() => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        page.search.value = 'SpikeGLX'
      })

      await takeScreenshot('search-behavior')

      await evaluate((interfaces) => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        const [name, info] = Object.entries(interfaces)[0]
        page.list.add({ key: name, value: name });
        page.searchModal.toggle(false);
      }, testInterfaceInfo)

      await takeScreenshot('interface-added', 1000)

      await evaluate((interfaces) => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        Object.keys(interfaces).slice(1).forEach(name => page.list.add({ key: name, value: name }))
      }, testInterfaceInfo)

      await takeScreenshot('all-interfaces-added')

      await toNextPage('locate')

    }, 10 * 1000)

    test('Locate all your source data programmatically', async () => {

      await takeScreenshot('pathexpansion-page', 300)

      await evaluate(async () => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        page.optional.yes.onClick()

        Object.values(page.form.accordions).forEach(accordion => accordion.toggle(true))

      }, testInterfaceInfo)

      await takeScreenshot('pathexpansion-selected')

      // Fill out the path expansion information
      await evaluate((interfaceInfo, basePath) => {
        const dashboard = document.querySelector('nwb-dashboard')
        const form = dashboard.page.form

        Object.entries(interfaceInfo).forEach(([name, info]) => {
          const baseInput = form.getFormElement([name, 'base_directory'])
          baseInput.updateData(basePath)

          const formatInput = form.getFormElement([name, 'format_string_path'])
          formatInput.updateData(info.format)
        })

        dashboard.main.querySelector('main > section').scrollTop = 200

      },
      testInterfaceInfo,
      join(testDataPath, 'dataset')
      )


      await takeScreenshot('pathexpansion-completed', 300)

      await toNextPage('subjects')
    })


    test('Provide subject information', async () => {

      await takeScreenshot('subject-page', 300)


      // Set invalid age
      await evaluate(async () => {
        const dashboard = document.querySelector('nwb-dashboard')
        const table = dashboard.page.table

        const data = { ...table.data }
        data[Object.keys(data)[0]].age = '30'
        table.data = data
      })

      await takeScreenshot('subject-invalid', 600)

      await toNextPage(null)

      await takeScreenshot('subject-error', 500)

      await evaluate(() => {
        const dashboard = document.querySelector('nwb-dashboard')

        const page =  dashboard.page
        page.dismiss()

        const table = page.table

        const data = { ...table.data }

        for (let name in data) {
          data[name] = {
            ...data[name],
            sex: 'M',
            species: 'Mus musculus',
            age: 'P30D'
          }
        }

        table.data = data // This changes the render but not the update flag

      })

      await takeScreenshot('subject-complete', 500)

      await toNextPage('sourcedata')

    })

    test('Review source data information', async () => {

      await takeScreenshot('sourcedata-page', 100)
      await toNextPage('metadata')

    })

    test('Review metadata', async () => {

      await takeScreenshot('metadata-page', 100)

      await evaluate(() => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        page.forms[0].form.accordions["Subject"].toggle(true)
      })

      await takeScreenshot('metadata-open', 100)

      await toNextPage('inspect')

    }, 30 * 1000) // Wait for conversion to complete

    test('Review NWB Inspector output', async () => {

      await takeScreenshot('inspect-page', 2000) // Finish file inspection
      await toNextPage('preview')

    })

    test('Review Neurosift visualization', async () => {

      await takeScreenshot('preview-page', 1000) // Finish loading Neurosift
      await toNextPage('upload')

      if (skipUpload) await toHome()

    }, 60 * 1000) // Wait for full conversion to complete

    const uploadDescribe = skipUpload ? describe.skip: describe

    uploadDescribe('Upload to DANDI', () => {

      test('Upload pipeline output to DANDI', async () => {

        await takeScreenshot('upload-page', 100)

        await evaluate(async () => {
          const dashboard = document.querySelector('nwb-dashboard')
          const page =  dashboard.page
          await page.rendered
          page.click() // Ensure page is clicked (otherwise, Electron crashes after DANDI upload after this...)
        })

        await takeScreenshot('upload-page-api-tokens', 100)

        await evaluate(async (dandiAPIToken) => {
          const dashboard = document.querySelector('nwb-dashboard')
          const page =  dashboard.page
          const modal = page.globalModal
          const stagingKeyInput = modal.form.getFormElement([ 'staging_api_key' ])
          stagingKeyInput.updateData(dandiAPIToken)
        }, dandiInfo.token)

        await takeScreenshot('upload-page-api-token-added', 100)

        await evaluate(async (dandisetId) => {
          const dashboard = document.querySelector('nwb-dashboard')
          const page =  dashboard.page
          const modal = page.globalModal
          await modal.footer.onClick() // Validate and submit value
          const idInput = page.form.getFormElement(["dandiset"])
          idInput.updateData(dandisetId)
        }, dandiInfo.id)

        await takeScreenshot('upload-page-with-id', 100)

        await sleep(500) // Wait for input status to update

        await toNextPage('review')

      }, 3 * 60 * 1000) // Wait for upload to finish (~2min on M2)


      test('Review upload results', async () => {

        await takeScreenshot('review-page', 1000)
        await toNextPage()

      })

    })

    test('Ensure there is one completed pipeline', async () => {
      await takeScreenshot('home-page', 100)
      const nPipelines = await evaluate(() => document.getElementById('guided-div-resume-progress-cards').children.length)
      expect(nPipelines).toBe(1)
    })

  })

})
