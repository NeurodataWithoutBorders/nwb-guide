import { describe, expect, test, beforeAll } from 'vitest'

import { join } from 'node:path'
import { mkdirSync, existsSync } from 'node:fs'

import { homedir } from 'node:os'

import examplePipelines from "../../src/example_pipelines.yml";

import paths from "../../src/paths.config.json" assert { type: "json" };

import { evaluate, initTests, takeScreenshot } from './utils'
import { header } from '../../src/electron/frontend/core/components/forms/utils'
import { sleep } from '../puppeteer';


// NOTE: We assume the user has put the GIN data in ~/NWB_GUIDE/test-data/GIN
const testGINPath = process.env.GIN_DATA_DIRECTORY ?? join(homedir(), paths.root, 'test-data', 'GIN')
console.log('Using test GIN data at:', testGINPath)

const pipelineDescribeFn = existsSync(testGINPath) ? describe : describe.skip

beforeAll(() => initTests({ screenshots: false, data: false }))

describe('Run example pipelines', () => {

  test('Ensure test data is present', () => {
    expect(existsSync(testGINPath)).toBe(true)
  })


  test('Ensure number of example pipelines starts at zero', async () => {
    const nPipelines = await evaluate(() => document.getElementById('guided-div-resume-progress-cards').children.length)
    expect(nPipelines).toBe(0)
  })

  // NOTE: The following code is dependent on the presence of test data on the user's computer
  pipelineDescribeFn('Generate and run pipeline from YAML file', () => {

    test('All example pipelines are created', async () => {

      const result = await evaluate(async (testGINPath) => {

        // Transition to settings page
        const dashboard = document.querySelector('nwb-dashboard')
        dashboard.sidebar.select('settings')
        await new Promise(resolve => setTimeout(resolve, 200))

        const page = dashboard.page

        // Open relevant accordion
        const accordion = page.form.accordions['developer']
        accordion.toggle(true)

        // Generate example pipelines
        const folderInput = page.form.getFormElement(["developer", "testing_data_folder"])
        folderInput.updateData(testGINPath)

        const button = folderInput.nextSibling
        const results = await button.onClick()

        page.save()
        page.dismiss() // Dismiss any notifications

        return results

      }, testGINPath)

      await sleep(500) // Wait for notification to dismiss

      const allPipelineNames = Object.keys(examplePipelines).reverse()

      expect(result).toEqual(allPipelineNames.map(name => { return { name, success: true } }))

      await takeScreenshot(join('test-pipelines', 'created'))


      // Transition back to the conversions page and count pipelines
      const renderedPipelineNames = await evaluate(async () => {
        const dashboard = document.querySelector('nwb-dashboard')
        dashboard.sidebar.select('/')
        await new Promise(resolve => setTimeout(resolve, 200))
        const pipelineCards = document.getElementById('guided-div-resume-progress-cards').children
        return Array.from(pipelineCards).map(card => card.info.project.name)
      })

      await takeScreenshot(join('test-pipelines', 'list'), 500)


      // Assert all the pipelines are present
      expect(renderedPipelineNames.sort()).toEqual(allPipelineNames.map(header).sort())

    })


    for (let pipeline in examplePipelines) {

      const pipelineParsed = header(pipeline)
      const info = examplePipelines[pipeline]
      const describeFn = info.test === false ? describe.skip : describe

      describeFn(`${pipelineParsed}`, async () => {

        test(`Full conversion completed`, async () => {

          // Start pipeline
          const started = await evaluate(async (toMatch) => {
            // const dashboard = document.querySelector('nwb-dashboard')
            // if (dashboard.page.info.id !== '//') await dashboard.page.to('/') // Go back to home page
            const pipelines = document.getElementById('guided-div-resume-progress-cards').children
            const found = Array.from(pipelines).find(card => card.info.project.name === toMatch)
            if (found) found.querySelector('button')!.click()
            return !!found
          }, pipelineParsed)

          expect(started).toBe(true)

          let pageId;

          while (pageId !== '/') {
            pageId = await evaluate(async () => {
              const dashboard = document.querySelector('nwb-dashboard')

              const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

              // Update this with a while loop to advance through the pipeline until back at the home page
              await sleep(100)

              try {
                await dashboard.next()
                await dashboard.page.rendered
              } catch (e) {
                await dashboard.page.to('/')
              } // Go back to the home page if error

              return dashboard.page.info.id
            })

            await takeScreenshot(join('test-pipelines', 'conversion', pipelineParsed, pageId))

            // Stop the pipeline. Conversion page is the last page
            if (pageId === '//conversion') {

              pageId = await evaluate(async () => {
                const dashboard = document.querySelector('nwb-dashboard')
                await dashboard.page.to('/')
                return dashboard.page.info.id
              })

              expect(pageId).toBe('/') // Will break while loop if failed
              break

            }
          }

        })
      })
    }
  })
})
