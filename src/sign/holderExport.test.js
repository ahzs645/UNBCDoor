import assert from 'node:assert/strict'
import test from 'node:test'
import { cardHolders } from '../data/cardHolders.js'
import { holderFileName, holderPresetCode, holdersFromFile, holdersToFile } from './holderExport.js'

const custom = {
  custom: true,
  insertSize: { width: 7.677, height: 3.976 },
  viewableOffset: { top: 0, bottom: 0, left: 0.512, right: 0.512 },
  plateStyle: 'line',
  plateLineColor: '#b0234e',
  roomNumber: '6-101',
  notes: "Measured at Sam's door"
}

test('preset code is a cardHolders.js entry that evaluates back to the same holder', () => {
  const code = holderPresetCode('Building 6', custom)
  const preset = Function(`return {${code}}`)()['Building 6']
  assert.deepEqual(preset.insertSize, custom.insertSize)
  assert.deepEqual(preset.viewableOffset, custom.viewableOffset)
  assert.deepEqual(preset.viewableSize, { width: 6.653, height: 3.976 })
  assert.equal(preset.plateLineColor, '#b0234e')
  assert.equal(preset.roomNumber, '6-101')
  assert.equal(preset.notes, "Measured at Sam's door")
  assert.match(preset.description, /^195mm × 101mm insert/)
})

test('a built-in preset keeps its own name and description', () => {
  const preset = Function(`return {${holderPresetCode('6-352', cardHolders['6-352'])}}`)()['6-352']
  assert.equal(preset.name, cardHolders['6-352'].name)
  assert.equal(preset.description, cardHolders['6-352'].description)
  assert.equal(preset.roomNumber, '6-352')
})

test('an exported file imports back to the same holders; other files import nothing', () => {
  const holders = holdersFromFile(holdersToFile({ 'Building 6': custom, '6-352': cardHolders['6-352'] }))
  assert.deepEqual(Object.keys(holders), ['Building 6', '6-352'])
  assert.equal(holders['Building 6'].plateLineColor, '#b0234e')
  assert.equal(holders['6-352'].plateStyle, 'plain')
  assert.deepEqual(holdersFromFile('{"signs": []}'), {})
  assert.deepEqual(holdersFromFile('not json'), {})
})

test('file names are tidy', () => {
  assert.equal(holderFileName('Building 6 (measured)'), 'holder-building-6-measured.json')
})
