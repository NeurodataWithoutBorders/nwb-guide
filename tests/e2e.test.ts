import { beforeAll, describe, expect, test } from 'vitest'
import { connect, sleep } from './puppeteer'

import { mkdirSync, existsSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

import paths from "../paths.config.json" assert { type: "json" };
import { ScreenshotOptions } from 'puppeteer'

// ------------------------------------------------------------------
// ------------------------ Path Definitions ------------------------
// ------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotPath = join(__dirname, '..', 'docs', 'tutorials', 'screenshots')
const guideRootPath = join(homedir(), paths.root)
const testRootPath = join(guideRootPath, '.test')
const testDataRootPath = join(testRootPath, 'test-data')
const testDataPath = join(testDataRootPath, 'data')
const testDatasetPath = join(testDataRootPath, 'dataset')

const windowDims = {
  width: 1280,
  height: 800
}

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
  common: {
    SpikeGLXRecordingInterface: {
      id: 'SpikeGLX Recording',
    },
    PhySortingInterface: {
      id: 'Phy Sorting'
    }
  },
  multi: {
    SpikeGLXRecordingInterface: {
      format: '{subject_id}/{subject_id}_{session_id}/{subject_id}_{session_id}_g0/{subject_id}_{session_id}_g0_imec0/{subject_id}_{session_id}_g0_t0.imec0.ap.bin'
    },
    PhySortingInterface: {
      format: '{subject_id}/{subject_id}_{session_id}/{subject_id}_{session_id}_phy'
    }
  },
  single: {
    SpikeGLXRecordingInterface: {
      file_path: join(testDataPath, 'spikeglx', 'Session1_g0', 'Session1_g0_imec0', 'Session1_g0_t0.imec0.ap.bin')
    },
    PhySortingInterface: {
      folder_path: join(testDataPath, 'phy')
    }
  }
}

const subjectInfo = {
  sex: 'M',
  species: 'Mus musculus',
  age: 'P30D'
}

// const regenerateTestData = !existsSync(testDataRootPath) || false // Generate only if doesn't exist
const regenerateTestData = true // Force regeneration

const dandiInfo = {
  id: '212750',
  token: process.env.DANDI_STAGING_API_KEY
}

// -------------------------------------------------------
// ------------------------ Tests ------------------------
// -------------------------------------------------------

const skipUpload = true // dandiInfo.token ? false : true

if (skipUpload) console.log('No DANDI API key provided. Will skip upload step...')

beforeAll(() => {

  if (regenerateTestData) {
    if (existsSync(testDataRootPath)) rmSync(testDataRootPath, { recursive: true })
  }

  alwaysDelete.forEach(path => existsSync(path) ? rmSync(path, { recursive: true }) : '')

  if (existsSync(screenshotPath)) rmSync(screenshotPath, { recursive: true })
  mkdirSync(screenshotPath, { recursive: true })
})

describe('E2E Test', () => {

  const references = connect()

  const takeScreenshot = async (label, delay = 0, options: ScreenshotOptions = { fullPage: true }) => {
    if (delay) await sleep(delay)

    const pathToScreenshot = join(screenshotPath, `${label}.png`)

    if (existsSync(pathToScreenshot)) return console.error(`Screenshot already exists: ${pathToScreenshot}`)

    await references.page.screenshot({ path: pathToScreenshot, ...options });
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

      const x = 250 // Sidebar size
      const width = windowDims.width - x

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

    })

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
      await toNextPage('workflow')

    })

    test('View the pre-form workflow page', async () => {

        await references.page.evaluate(() => {
          const dashboard = document.querySelector('nwb-dashboard')
          const page = dashboard.page

          const subjectId = page.form.getFormElement(['subject_id'])
          subjectId.updateData('subject1')

          const sessionId = page.form.getFormElement(['session_id'])
          sessionId.updateData('session1')
        })

        await takeScreenshot('workflow-page', 300)


        await toNextPage('structure')
    })

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
        page.list.add({ key: info.id, value: name });
        page.searchModal.toggle(false);
      }, testInterfaceInfo.common)

      await takeScreenshot('interface-added', 1000)

      await evaluate((interfaces) => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        Object.entries(interfaces).slice(1).forEach(([ name, info ]) => page.list.add({ key: info.id, value: name }))
      }, testInterfaceInfo.common)

      await takeScreenshot('all-interfaces-added')

      // await toNextPage('locate')
      // await toNextPage('subjects')
      await toNextPage('sourcedata')

    })

    // NOTE: Locate data is skipped in single session mode
    test.skip('Locate all your source data programmatically', async () => {

      await evaluate(async () => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        Object.values(page.form.accordions).forEach(accordion => accordion.toggle(true))
      }, testInterfaceInfo.multi)

      await takeScreenshot('pathexpansion-page')

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
      testInterfaceInfo.multi,
      testDatasetPath
      )


      await takeScreenshot('pathexpansion-completed', 300)

      await toNextPage('subjects')
    })


    // NOTE: Subject information is skipped in single session mode
    test.skip('Provide subject information', async () => {

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
          data[name] = { ...data[name], ...subjectInfo }
        }

        table.data = data // This changes the render but not the update flag

      })

      await takeScreenshot('subject-complete', 500)

      await toNextPage('sourcedata')

    })

    // NOTE: This isn't pre-filled in single session mode
    test.skip('Review source data information', async () => {

      await takeScreenshot('sourcedata-page', 100)
      await toNextPage('metadata')

    })

    test('Specify source data information', async () => {

      await references.page.evaluate(async () => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        Object.values(page.forms[0].form.accordions).forEach(accordion => accordion.toggle(true))
      })

      await takeScreenshot('sourcedata-page', 100)

      await references.page.evaluate(({ single, common }) => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page

        Object.entries(common).forEach(([name, info]) => {
          const form = page.forms[0].form.forms[info.id]

          const interfaceInfo = single[name]
          for (let key in single[name]) {
            const input = form.getFormElement([ key ])
            input.updateData(interfaceInfo[key])
          }
        })
      }, testInterfaceInfo)

      await takeScreenshot('sourcedata-page-specified', 100)


      await toNextPage('metadata')

    })

    test('Review metadata', async () => {

      await takeScreenshot('metadata-page', 100)

      await evaluate(() => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        page.forms[0].form.accordions["Subject"].toggle(true)
      })

      // Update for single session
      await evaluate((subjectInfo) => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        const form = page.forms[0].form.forms['Subject']

        for (let key in subjectInfo) {
          const input = form.getFormElement([ key ])
          input.updateData(subjectInfo[key])
        }
      }, subjectInfo)

      await takeScreenshot('metadata-open', 100)

      await toNextPage('inspect')

    }) // Wait for conversion preview to complete

    test('Review NWB Inspector output', async () => {

      await takeScreenshot('inspect-page', 2000) // Finish file inspection
      await toNextPage('preview')

    })

    test('Review Neurosift visualization', async () => {
      await takeScreenshot('preview-page', 1000) // Finish loading Neurosift
      await toNextPage('conversion')
    })

    test('View the conversion results', async () => {

      await takeScreenshot('conversion-results-page', 1000)
      await toNextPage('upload')
      if (skipUpload) await toHome()

  })

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

      }) // Wait for upload to finish (~2min on M2)


      test('Review upload results', async () => {

        await takeScreenshot('review-page', 1000)
        await toNextPage()

      })

    })

    test('Ensure there is one completed pipeline', async () => {
      await takeScreenshot('home-page-complete', 100)
      const nPipelines = await evaluate(() => document.getElementById('guided-div-resume-progress-cards').children.length)
      expect(nPipelines).toBe(1)
    })

  })

})
