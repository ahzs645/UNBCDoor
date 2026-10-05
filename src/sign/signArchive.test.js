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

test('defaults the department line to the UNBC wrap', () => {
  assert.equal(normalizeSignData({}).departmentWrap, 'logo')
  assert.equal(normalizeSignData({ departmentWrap: 'band' }).departmentWrap, 'band')
  assert.equal(normalizeSignData({ departmentWrap: 'sideways' }).departmentWrap, 'logo')
})

test('keeps the designation layout options it knows', () => {
  assert.equal(normalizeSignData({ designationLayout: 'together' }).designationLayout, 'together')
  assert.equal(normalizeSignData({ designationLayout: 'sideways' }).designationLayout, 'inline')
})

test('keeps roles as position / department pairs and drops anything else', () => {
  const sign = normalizeSignData({
    roles: [
      { title: 'Director', unit: 'Northern Analytical Laboratory Services' },
      { title: 'Professor' },
      'Dean',
      null,
      { title: 7, unit: 'Faculty of Environment' }
    ],
    roles2: 'Director',
    roleLayout: 'sideways'
  })

  assert.deepEqual(sign.roles, [
    { title: 'Director', unit: 'Northern Analytical Laboratory Services' },
    { title: 'Professor', unit: '' },
    { title: '', unit: 'Faculty of Environment' }
  ])
  assert.deepEqual(sign.roles2, [])
  assert.equal(sign.roleLayout, 'aligned')
  assert.equal(normalizeSignData({ roleLayout: 'inline' }).roleLayout, 'inline')
})
