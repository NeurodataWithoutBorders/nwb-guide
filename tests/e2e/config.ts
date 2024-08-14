import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import { existsSync } from 'node:fs'

import paths from "../../src/paths.config.json" assert { type: "json" };
import { connect as connectToElectron } from './puppeteer';

// ------------------------------------------------------------------
// ------------------------ Path Definitions ------------------------
// ------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
export const screenshotPath = join(__dirname, '..', '..', 'docs', 'assets', 'tutorials')
const guideRootPath = join(homedir(), paths.root)
const testRootPath = join(guideRootPath, '.test')
export const testDataRootPath = join(testRootPath, 'test-data')
const testDataPath = join(testDataRootPath, 'single_session_data')
export const testDatasetPath = join(testDataRootPath, 'multi_session_dataset')

export const windowDims = {
  width: 1280,
  height: 800
}

export const alwaysDelete = [
  join(testRootPath, 'pipelines'),
  join(testRootPath, 'conversions'),
  join(testRootPath, 'preview'),
  join(testRootPath, 'config.json')
]


// -----------------------------------------------------------------------
// ------------------------ Configuration Options ------------------------
// -----------------------------------------------------------------------

const autocompleteOptions = {
  subject_id: 'mouse1',
  session_id: 'Session1'
}

const { subject_id, session_id } = autocompleteOptions

export const testInterfaceInfo = {
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
      format: '{subject_id}/{subject_id}_{session_id}/{subject_id}_{session_id}_g0/{subject_id}_{session_id}_g0_imec0/{subject_id}_{session_id}_g0_t0.imec0.ap.bin',
      autocomplete: {}
    },
    PhySortingInterface: {
      format: '{subject_id}/{subject_id}_{session_id}/{subject_id}_{session_id}_phy',
      autocomplete: {}
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

// Add autocomplete options
Object.entries(testInterfaceInfo.multi).forEach(([key, value]) => {
  const format = value.format
  value.autocomplete = {
    path: join(testDatasetPath, format.replace(/{subject_id}/g, subject_id).replace(/{session_id}/g, session_id)),
    ...autocompleteOptions,
  }
})


export const subjectInfo = {
  common: {
    sex: 'M',
    species: 'Mus musculus',
  },

  single: {
    age: 'P25W'
  },

  multiple: {
    mouse1: {
      age: 'P29W',
      sex: 'F'
    },
    mouse2: {
      age: 'P30W'
    }
  }
}

export const regenerateTestData = !existsSync(testDataPath) || !existsSync(testDatasetPath) || false // Generate only if doesn't exist
// export const regenerateTestData = true // Force regeneration

export const dandiInfo = {
  id: '212750',
  token: process.env.DANDI_STAGING_API_KEY
}

// -------------------------------------------------------
// ------------------------ Tests ------------------------
// -------------------------------------------------------

export const publish = dandiInfo.token ? true : false

if (!publish) console.log('No DANDI API key provided. Will skip dataset publication step...')


export const references = connectToElectron()
