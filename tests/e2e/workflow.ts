import { describe, expect, test } from "vitest"

import { sleep } from '../puppeteer'

import { join } from 'node:path'
import { evaluate, takeScreenshot, toNextPage } from "./utils"
import { dandiInfo, publish, subjectInfo, testDatasetPath, testInterfaceInfo } from "./config"

export const uploadToDandi = (subdirectory, forceSkip = false) => {


  const uploadDescribe = !publish || forceSkip ? describe.skip : describe

  uploadDescribe('Upload to DANDI', () => {

    test('Upload pipeline output to DANDI', async () => {

      await evaluate(async () => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        await page.rendered
        page.click() // Ensure page is clicked (otherwise, Electron crashes after DANDI upload after this...)
      })

      await takeScreenshot(join(subdirectory, 'api-tokens'), 100)

      await evaluate(async (dandiAPIToken) => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        const modal = page.globalModal
        const stagingKeyInput = modal.form.getFormElement(['staging_api_key'])
        stagingKeyInput.updateData(dandiAPIToken)
      }, dandiInfo.token)

      await takeScreenshot(join(subdirectory, 'api-token-added'), 100)


      // Open dandiset creation modal
      await evaluate(() => {
        const dashboard = document.querySelector('nwb-dashboard')
        const form = dashboard.page.form
        const dandisetInput = form.getFormElement(['dandiset'])
        const createDandiset = dandisetInput.controls[0]
        createDandiset.onClick()
      })

      await takeScreenshot(join(subdirectory, 'create-dandiset'), 100)

      // Close modal
      await evaluate(() => {
        const modal = document.querySelector('nwb-modal') as any
        modal.toggle(false)
      })

      await evaluate(async (dandisetId) => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        const modal = page.globalModal
        await modal.footer.onClick() // Validate and submit value
        const idInput = page.form.getFormElement(["dandiset"])
        idInput.updateData(dandisetId)
      }, dandiInfo.id)

      await takeScreenshot(join(subdirectory, 'dandiset-id'), 1000)

      await sleep(500) // Wait for input status to update

      await toNextPage('review')

    }, 5 * 60 * 1000) // Wait for upload to finish (~2min on M2). Ensure 5min of possible wait


    test('Review upload results', async () => {

      await takeScreenshot(join(subdirectory, 'review-page'), 1000)
      await toNextPage()

    })
  })

}


export default async function runWorkflow(name, workflow, identifier) {

  const willLocateData = workflow.multiple_sessions && workflow.locate_data
  const willProvideSubjectInfo = workflow.multiple_sessions

  test('Create new pipeline by specifying a name', async () => {

    // Advance to general information page
    await toNextPage('details')

    await takeScreenshot(join(identifier, 'info-page'), 300)

    // Fail to advance without name
    await toNextPage('details')

    await takeScreenshot(join(identifier, 'fail-name'), 500)

    // Fill in name of the test pipeline
    await evaluate(({ name }) => {
      const dashboard = document.querySelector('nwb-dashboard')
      const page = dashboard.page
      page.dismiss() // Dismiss all internal notifications

      const nameInput = page.form.getFormElement(['name'])
      nameInput.updateData(name)
    }, { name })

    await takeScreenshot(join(identifier, 'valid-name'), 600) // Ensure name error disappears

    // Advance to formats page
    await toNextPage('workflow')

  })

  test('View the pre-form workflow page', async () => {

    await evaluate((workflow) => {
      const dashboard = document.querySelector('nwb-dashboard')
      const page = dashboard.page

      for (let key in workflow) {
        const input = page.form.getFormElement([key])
        input.updateData(workflow[key])
      }

      page.form.requestUpdate() // Ensure the form is updated visually

    }, workflow)

    await takeScreenshot(join(identifier, 'workflow-page'), 300)


    await toNextPage('structure')
  })

  test('Specify data formats', async () => {

    await takeScreenshot(join(identifier, 'formats-page'), 300)

    await evaluate(() => {
      const dashboard = document.querySelector('nwb-dashboard')
      const page = dashboard.page
      page.addButton.onClick()
    })

    await takeScreenshot(join(identifier, 'format-options'), 1000)

    await evaluate(() => {
      const dashboard = document.querySelector('nwb-dashboard')
      const page = dashboard.page
      page.search.value = 'SpikeGLX'
    })

    await takeScreenshot(join(identifier, 'search-behavior'))

    await evaluate((interfaces) => {
      const dashboard = document.querySelector('nwb-dashboard')
      const page = dashboard.page
      const [name, info] = Object.entries(interfaces)[0]
      page.list.add({ key: info.id, value: name });
      page.searchModal.toggle(false);
    }, testInterfaceInfo.common)

    await takeScreenshot(join(identifier, 'interface-added'), 1000)

    await evaluate((interfaces) => {
      const dashboard = document.querySelector('nwb-dashboard')
      const page = dashboard.page
      Object.entries(interfaces).slice(1).forEach(([name, info]) => page.list.add({ key: info.id, value: name }))
    }, testInterfaceInfo.common)

    await takeScreenshot(join(identifier, 'all-interfaces-added'))

    if (willLocateData) await toNextPage('locate')
    else if (willProvideSubjectInfo) await toNextPage('subjects')
    else await toNextPage('sourcedata')

  })

  const locateDataTest = willLocateData ? test : test.skip

  // NOTE: Locate data is skipped in single session mode
  locateDataTest('Locate all your source data programmatically', async () => {

    await evaluate(async () => {
      const dashboard = document.querySelector('nwb-dashboard')
      const page = dashboard.page
      Object.values(page.form.accordions).forEach(accordion => accordion.toggle(true))
    }, testInterfaceInfo.multi)

    await takeScreenshot(join(identifier, 'pathexpansion-page'))

    const interfaceId = await evaluate(() => {
      const dashboard = document.querySelector('nwb-dashboard')
      const form = dashboard.page.form
      const id = Object.keys(form.accordions)[0]
      const formatInput = form.getFormElement([id, 'format_string_path'])
      const autocompleteButton = formatInput.controls[0]
      autocompleteButton.onClick()
      return id
    })

    // Use autocomplete on first interface
    const name = Object.entries(testInterfaceInfo.common).find(([name, info]) => info.id === interfaceId)![0]
    const autocompleteInfo = testInterfaceInfo.multi[name].autocomplete

    await takeScreenshot(join(identifier, 'pathexpansion-autocomplete-open'), 300)

    await evaluate(info => {
      const modal = document.querySelector('nwb-modal') as any
      const form = modal.querySelector('nwb-jsonschema-form')

      Object.entries(info).forEach(([key, value]) => {
        const formatInput = form.getFormElement([ key ])
        formatInput.updateData(value)
      })

    }, autocompleteInfo)

    await takeScreenshot(join(identifier, 'pathexpansion-autocomplete-filled'), 300)

    // Submit the autocomplete information
    await evaluate(() => {
      const modal = document.querySelector('nwb-modal') as any
      modal.footer.onClick()
    }, autocompleteInfo)

    await takeScreenshot(join(identifier, 'pathexpansion-autocomplete-submitted'), 1000)

    // Fill out the other path expansion information
    await evaluate(({ multi, common }) => {
      const dashboard = document.querySelector('nwb-dashboard')
      const form = dashboard.page.form

      const accordionKeys = Object.keys(form.accordions)

      // Fill out the path expansion information for non-autocompleted interfaces
      accordionKeys.slice(1).forEach(id => {
        const name = Object.entries(common).find(([_, info]) => info.id === id)![0]
        const { format } = multi[name]
        const formatInput = form.getFormElement([id, 'format_string_path'])
        formatInput.updateData(format)
      })

    }, testInterfaceInfo)


    await takeScreenshot(join(identifier, 'pathexpansion-completed'), 300)

    await toNextPage('subjects')

  })


  const subjectTableTest = willProvideSubjectInfo ? test : test.skip

  // NOTE: Subject information is skipped in single session mode
  subjectTableTest('Provide subject information', async () => {

    await takeScreenshot(join(identifier, 'subject-page'), 300)

    // Set invalid age
    await evaluate(async () => {
      const dashboard = document.querySelector('nwb-dashboard')
      const table = dashboard.page.table

      const data = { ...table.data }
      data[Object.keys(data)[0]].age = '30'
      table.data = data
    })

    await takeScreenshot(join(identifier, 'subject-invalid'), 600)

    await toNextPage(null)

    await takeScreenshot(join(identifier, 'subject-error'), 500)

    await evaluate(({ common, multiple }) => {
      const dashboard = document.querySelector('nwb-dashboard')

      const page = dashboard.page
      page.dismiss()

      const table = page.table

      const data = { ...table.data }


      for (let name in data) {
        const subjectInfo = { ...common, ...(multiple[name] ?? {}) }
        data[name] = { ...data[name], ...subjectInfo }
      }

      table.data = data // This changes the render but not the update flag

    }, subjectInfo)

    await takeScreenshot(join(identifier, 'subject-complete'), 500)

    await toNextPage('sourcedata')

  })

  if (willLocateData) {

    test('Review source data information', async () => {

      await takeScreenshot(join(identifier, 'sourcedata-page'), 100)
      await toNextPage('metadata')

    })

  }

  else {

    test('Specify source data information', async () => {

      await evaluate(async () => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        Object.values(page.forms[0].form.accordions).forEach(accordion => accordion.toggle(true))
      })

      await takeScreenshot(join(identifier, 'sourcedata-page'), 100)

      await evaluate(({ single, common }) => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page

        Object.entries(common).forEach(([name, info]) => {
          const form = page.forms[0].form.forms[info.id]

          const interfaceInfo = single[name]
          for (let key in single[name]) {
            const input = form.getFormElement([key])
            input.updateData(interfaceInfo[key])
          }
        })
      }, testInterfaceInfo)

      await takeScreenshot(join(identifier, 'sourcedata-page-specified'), 100)


      await toNextPage('metadata')

    })

  }

  test('Review metadata', async () => {

    await takeScreenshot(join(identifier, 'metadata-page'), 300) // Ensures no user-select highlight

    await evaluate(() => {
      const dashboard = document.querySelector('nwb-dashboard')
      const page = dashboard.page
      const firstSessionForm = page.forms[0].form
      firstSessionForm.accordions["NWBFile"].toggle(true)
    })

    await takeScreenshot(join(identifier, 'metadata-nwbfile'), 100)

    await evaluate(() => {
      const dashboard = document.querySelector('nwb-dashboard')
      const page = dashboard.page
      const firstSessionForm = page.forms[0].form
      firstSessionForm.accordions["Subject"].toggle(true)
      firstSessionForm.accordions["NWBFile"].toggle(false)
    })

    if (!willProvideSubjectInfo) {

      // Update for single session
      await evaluate(({ common, single = {} }) => {
        const dashboard = document.querySelector('nwb-dashboard')
        const page = dashboard.page
        const firstSessionForm = page.forms[0].form
        const form = firstSessionForm.forms['Subject']

        const subjectInfo = { ...common, ...single }

        for (let key in subjectInfo) {
          const input = form.getFormElement([key])
          input.updateData(subjectInfo[key])
        }
      }, subjectInfo)

    }

    await takeScreenshot(join(identifier, 'metadata-subject-complete'), 100)

    await evaluate(() => {
      const dashboard = document.querySelector('nwb-dashboard')
      const page = dashboard.page
      const firstSessionForm = page.forms[0].form
      firstSessionForm.accordions["Ecephys"].toggle(true)
      firstSessionForm.accordions["Subject"].toggle(false)
    })

    await takeScreenshot(join(identifier, 'metadata-ecephys'), 100)


    await toNextPage('inspect')

  }) // Wait for conversion preview to complete

  test('Review NWB Inspector output', async () => {

    await evaluate(async () => {
        const dashboard = document.querySelector('nwb-dashboard')
        await dashboard.page.rendered
    })

    await takeScreenshot(join(identifier, 'inspect-page'), 100) // Allow for the completion of file validation
    await toNextPage('preview')

  })

  test('Review Neurosift visualization', async () => {
    await takeScreenshot(join(identifier, 'preview-page'), 1000) // Allow full load of Neurosift page
    await toNextPage('conversion')
  })

  test('View the conversion results', async () => {
    await takeScreenshot(join(identifier, 'conversion-results-page'), 1000)

    const conversionCompleted = await evaluate(() => {
      const dashboard = document.querySelector('nwb-dashboard')
      const page = dashboard.page
      return !!page.info.globalState.conversion
    })

    if (workflow.upload_to_dandi) await toNextPage('upload')
    else await toNextPage('')

    expect(conversionCompleted).toBe(true)

  })


  uploadToDandi(identifier, !workflow.upload_to_dandi)
}
