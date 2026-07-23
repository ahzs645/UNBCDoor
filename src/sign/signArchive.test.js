import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeSignData } from './signArchive.js'

test('preserves supported Alumni crest appearance settings', () => {
  const sign = normalizeSignData({
    alumniCrestSize: 'maximum',
    alumniCrestSpacing: 'wide'
  })

  assert.equal(sign.alumniCrestSize, 'maximum')
  assert.equal(sign.alumniCrestSpacing, 'wide')
})

test('falls back safely for unsupported Alumni crest appearance settings', () => {
  const sign = normalizeSignData({
    alumniCrestSize: 'oversized',
    alumniCrestSpacing: 'unlimited'
  })

  assert.equal(sign.alumniCrestSize, 'standard')
  assert.equal(sign.alumniCrestSpacing, 'auto')
})
