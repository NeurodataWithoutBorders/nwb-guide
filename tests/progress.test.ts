import { test } from 'vitest'
import { updateAppProgress } from '../src/renderer/src/progress/update'

test('updates to app progress do not fail', () => updateAppProgress('/', {}))
