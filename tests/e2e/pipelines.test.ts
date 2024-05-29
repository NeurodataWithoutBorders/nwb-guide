import { describe, expect, test, skip, beforeAll } from 'vitest'
import { connect } from '../puppeteer'

import { mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { homedir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotPath = join( __dirname, 'screenshots')
mkdirSync(screenshotPath, { recursive: true })

import examplePipelines from "../../src/example_pipelines.yml";

import paths from "../../src/paths.config.json" assert { type: "json" };
import { evaluate, initTests } from './utils'
import { header } from '../../src/electron/frontend/core/components/forms/utils'

// NOTE: We assume the user has put the GIN data in ~/NWB_GUIDE/test-data
const guideRootPath = join(homedir(), paths.root)
const testGINPath = join(guideRootPath, 'test-data', 'GIN')
const hasGINPath = existsSync(testGINPath)
const pipelineDescribeFn = hasGINPath ? describe : describe.skip

beforeAll(() => initTests({ screenshots: false, data: false }))

describe('Run example pipelines', () => {

    test('Ensure number of example pipelines starts at zero', async () => {
      const nPipelines = await evaluate(() => document.getElementById('guided-div-resume-progress-cards').children.length)
      expect(nPipelines).toBe(0)
    })

    // NOTE: The following code is dependent on the presence of test data on the user's computer
    pipelineDescribeFn('Generate and run pipeline from YAML file', () => {

      test('All example pipelines are created', async ( ) => {

        await evaluate(async (testGINPath) => {

            // Transition to settings page
            const dashboard = document.querySelector('nwb-dashboard')
            dashboard.sidebar.select('settings')
            await new Promise(resolve => setTimeout(resolve, 200))

            // Generate example pipelines
            const page = dashboard.page
            const folderInput = page.form.getFormElement(["developer", "testing_data_folder"])
            folderInput.updateData(testGINPath)

            // Open relevant accordion
            const accordion = page.form.accordions['developer']
            accordion.toggle(true)


            const button = folderInput.nextSibling
            await button.onClick()

            page.save()
        }, testGINPath)

        // Transition back to the conversions page and count pipelines
        const pipelineNames = await evaluate(async () => {
          const dashboard = document.querySelector('nwb-dashboard')
          dashboard.sidebar.select('/')
          await new Promise(resolve => setTimeout(resolve, 200))
          const pipelineCards = document.getElementById('guided-div-resume-progress-cards').children
          return Array.from(pipelineCards).map(card => card.info.project.name)
        })

        // Assert all the pipelines are present
        expect(pipelineNames.sort()).toEqual(Object.keys(examplePipelines).map(header).sort())

      })


      for (let pipeline in examplePipelines) {

        const pipelineParsed = header(pipeline)
        const info = examplePipelines[pipeline]
        const describeFn = info.test === false ? describe.skip : describe

        describeFn(`${pipelineParsed}`, async ( ) => {

            test(`Full conversion completed`, async () => {
              const wasFound = await evaluate(async (toMatch) => {
                const dashboard = document.querySelector('nwb-dashboard')
                const pipelines = document.getElementById('guided-div-resume-progress-cards').children
                const found = Array.from(pipelines).find(card => card.info.project.name === toMatch)
                if (found) {
                  found.querySelector('button')!.click()

                  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
                  const toHome = () => dashboard.page.to('/')

                  // Update this with a while loop to advance through the pipeline until back at the home page
                  while (document.querySelector('nwb-dashboard').page.info.id !== '//'){
                    await sleep(100)
                    try {
                     await dashboard.next()
                     await dashboard.page.rendered
                     const id = dashboard.page.info.id
                     if (id === '//conversion') break // Conversion page is the last page
                    } catch (e) {
                      await toHome()
                      return e.message // Return error
                    }
                  }

                  await toHome()

                  return true
                }
              }, pipelineParsed)

              expect(wasFound).toBe(true)
            })

        })

      }

    })
})
