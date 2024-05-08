import { describe, expect, test, skip, beforeAll } from 'vitest'
import { connect } from '../puppeteer'

import { mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { homedir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotPath = join( __dirname, 'screenshots')
mkdirSync(screenshotPath, { recursive: true })

import testingSuiteYaml from "../../guide_testing_suite.yml";

import paths from "../../paths.config.json" assert { type: "json" };
import { evaluate, initTests } from './utils'
import { header } from '../../src/renderer/src/stories/forms/utils'

// NOTE: We assume the user has put the GIN data in ~/NWB_GUIDE/test-data
const guideRootPath = join(homedir(), paths.root)
const testGINPath = join(guideRootPath, 'test-data', 'GIN')
const hasGINPath = existsSync(testGINPath)
const pipelineDescribeFn = hasGINPath ? describe : describe.skip

beforeAll(() => initTests({ screenshots: false, data: false }))

describe('Run tests pipelines', () => {

    test('Ensure number of test pipelines starts at zero', async () => {
      const nPipelines = await evaluate(() => document.getElementById('guided-div-resume-progress-cards').children.length)
      expect(nPipelines).toBe(0) 
    })

    // NOTE: The following code is dependent on the presence of test data on the user's computer
    pipelineDescribeFn('Generate and run pipeline from YAML file', () => {

      test('Can create test pipelines', async ( ) => {

        await evaluate(async (testGINPath) => {

            // Transition to settings page
            const dashboard = document.querySelector('nwb-dashboard')
            dashboard.sidebar.select('settings')
            await new Promise(resolve => setTimeout(resolve, 200))

            // Genereate test pipelines
            const page = dashboard.page
            const folderInput = page.form.getFormElement(["developer", "testing_data_folder"])
            folderInput.updateData(testGINPath)

            const button = folderInput.nextSibling
            await button.onClick()

            page.save()
        }, testGINPath)

        // Transiton back to conversions page and count pipelines
        const pipelineNames = await evaluate(async () => {
          const dashboard = document.querySelector('nwb-dashboard')
          dashboard.sidebar.select('/')
          await new Promise(resolve => setTimeout(resolve, 200))
          const pipelineCards = document.getElementById('guided-div-resume-progress-cards').children
          return Array.from(pipelineCards).map(card => card.info.project.name)
        })

        // Assert all the pipelines are present
        expect(pipelineNames.sort()).toEqual(Object.keys(testingSuiteYaml.pipelines).map(header).sort())

      })


      for (let pipeline in testingSuiteYaml.pipelines) {

        const pipelineParsed = header(pipeline)

        describe(`Can run the ${pipelineParsed} pipeline`, async ( ) => {

            test(`Can advance through entire pipeline`, async () => {
              const wasFound = await evaluate(async (toMatch) => {
                const dashboard = document.querySelector('nwb-dashboard')
                const pipelines = document.getElementById('guided-div-resume-progress-cards').children
                const found = Array.from(pipelines).find(card => card.info.project.name === toMatch)
                if (found) {
                  found.querySelector('button')!.click()

                  // Update this with a while loop to advance through the pipeline until back at the home page
                  await new Promise(resolve => setTimeout(resolve, 10))
                  dashboard.page.to('/')
                  return true
                }
              }, pipelineParsed)

              expect(wasFound).toBe(true)
            })

        })

      }

    })
})
