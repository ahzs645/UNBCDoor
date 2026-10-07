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

  const legacy = { note: '', unitLayout: 'beside', unitDivider: 'bar', titleLayout: 'inline' }
  assert.deepEqual(sign.roles, [
    { title: 'Director', unit: 'Northern Analytical Laboratory Services', ...legacy },
    { title: 'Professor', unit: '', ...legacy },
    { title: '', unit: 'Faculty of Environment', ...legacy }
  ])
  assert.deepEqual(sign.roles2, [])
  assert.equal(sign.roleLayout, 'aligned')
  assert.equal(normalizeSignData({ roleLayout: 'inline' }).roleLayout, 'inline')
})

test('keeps each role’s subtext and layouts, falling back for unknown layouts', () => {
  const sign = normalizeSignData({
    roles: [
      { title: 'Director', unit: 'NALS', note: 'Innovation Hub', unitLayout: 'below', titleLayout: 'stacked' },
      { title: 'Professor', unitLayout: 'sideways', unitDivider: 'slash', titleLayout: 'diagonal', note: 4 },
      { title: 'Manager', unit: 'NUGSS', unitDivider: 'none' }
    ]
  })

  assert.deepEqual(sign.roles, [
    { title: 'Director', unit: 'NALS', note: 'Innovation Hub', unitLayout: 'below', unitDivider: 'bar', titleLayout: 'stacked' },
    { title: 'Professor', unit: '', note: '', unitLayout: 'beside', unitDivider: 'bar', titleLayout: 'inline' },
    { title: 'Manager', unit: 'NUGSS', note: '', unitLayout: 'beside', unitDivider: 'none', titleLayout: 'inline' }
  ])
})

test('an old position field becomes the first role, split the way it printed', () => {
  const stacked = normalizeSignData({
    position: 'Associate Professor | Faculty of Environment',
    roles: [{ title: 'Director', unit: 'NALS' }],
    position2: 'Research Associate'
  })

  assert.equal(stacked.position, '')
  assert.equal(stacked.position2, '')
  assert.deepEqual(stacked.roles.map(role => [role.title, role.titleLayout]), [
    ['Associate Professor | Faculty of Environment', 'stacked'],
    ['Director', 'inline']
  ])
  assert.deepEqual(stacked.roles2.map(role => role.title), ['Research Associate'])

  const inline = normalizeSignData({ position: 'Professor | Geography', positionLayout: 'inline' })
  assert.equal(inline.roles[0].titleLayout, 'inline')
  assert.equal(inline.positionLayout, 'stacked')
})

test('keeps the organization, falling back to UNBC for one it doesn’t know', () => {
  assert.equal(normalizeSignData({}).organization, 'unbc')
  assert.equal(normalizeSignData({ organization: 'nugss' }).organization, 'nugss')
  assert.equal(normalizeSignData({ organization: 'acme' }).organization, 'unbc')
})

test('ligatures are on unless a sign turns them off', () => {
  assert.equal(normalizeSignData({}).ligatures, 'on')
  assert.equal(normalizeSignData({ ligatures: 'off' }).ligatures, 'off')
  assert.equal(normalizeSignData({ ligatures: 'sometimes' }).ligatures, 'on')
})

test('keeps the third person’s roles, and a sign without one has none', () => {
  const normalized = normalizeSignData({
    showThirdOccupant: true,
    name3: 'Alex Lee',
    roles3: [{ title: 'Research Associate', unit: 'Chemistry' }, 'not a role']
  })
  assert.equal(normalized.showThirdOccupant, true)
  assert.equal(normalized.name3, 'Alex Lee')
  assert.deepEqual(normalized.roles3.map(role => [role.title, role.unit]), [['Research Associate', 'Chemistry']])
  assert.deepEqual(normalizeSignData({}).roles3, [])
})
