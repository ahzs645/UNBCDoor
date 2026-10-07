import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CUSTOM_HOLDERS_KEY,
  parseCustomHolders,
  readCustomHolders,
  serializeCustomHolders,
  toCardHolder,
  toCustomRecord,
  validateCustomHolder,
  writeCustomHolders
} from './customHolders.js'

const holder = {
  name: 'Room 4-257',
  insertSize: { width: 6.85, height: 3.94 },
  viewableOffset: { top: 0.2, right: 0.15, bottom: 0.1, left: 0.15 },
  plateStyle: 'line',
  plateLineColor: '#1d6650'
}

const memoryStorage = () => {
  const items = new Map()
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value))
  }
}

test('a well-formed holder validates', () => {
  assert.deepEqual(validateCustomHolder(holder, ['Building 10']), [])
})

test('names must be present and unique (ignoring case)', () => {
  assert.equal(validateCustomHolder({ ...holder, name: '  ' }).length, 1)
  assert.equal(validateCustomHolder(holder, ['room 4-257']).length, 1)
})

test('the frame must leave a window', () => {
  const problems = validateCustomHolder({
    ...holder,
    viewableOffset: { top: 2, right: 0, bottom: 2, left: 0 }
  })
  assert.match(problems.join(' '), /no window/)
  assert.equal(validateCustomHolder({ ...holder, viewableOffset: { ...holder.viewableOffset, top: -1 } }).length, 1)
  assert.equal(validateCustomHolder({ ...holder, insertSize: { width: 0, height: 3 } }).length, 1)
})

test('a stored record becomes a preset shaped like the built-in ones', () => {
  const preset = toCardHolder(toCustomRecord(holder))
  assert.equal(preset.custom, true)
  assert.deepEqual(preset.viewableSize, { width: 6.55, height: 3.64 })
  assert.equal(preset.plateStyle, 'line')
  assert.equal(preset.plateLineColor, '#1d6650')
})

test('the line colour is dropped for a number-only plate', () => {
  assert.equal(toCustomRecord({ ...holder, plateStyle: 'plain' }).plateLineColor, undefined)
})

test('a holder keeps the room number on its plate, trimmed; a blank one is left out', () => {
  assert.equal(toCardHolder(toCustomRecord({ ...holder, roomNumber: ' 6-352 ' })).roomNumber, '6-352')
  assert.equal(toCustomRecord({ ...holder, roomNumber: '123456789' }).roomNumber, '12345678')
  assert.equal('roomNumber' in toCustomRecord({ ...holder, roomNumber: '  ' }), false)
  assert.equal('roomNumber' in toCustomRecord({ ...holder, roomNumber: 42 }), false)
})

test('storage round-trips, and junk in storage is ignored', () => {
  const storage = memoryStorage()
  assert.deepEqual(readCustomHolders(storage), {})
  assert.equal(writeCustomHolders({ [holder.name]: toCustomRecord(holder) }, storage), true)
  assert.deepEqual(Object.keys(readCustomHolders(storage)), ['Room 4-257'])

  storage.setItem(CUSTOM_HOLDERS_KEY, 'not json')
  assert.deepEqual(readCustomHolders(storage), {})

  const mixed = serializeCustomHolders({
    good: toCustomRecord(holder),
    bad: { insertSize: { width: 'x', height: 3 }, viewableOffset: {} }
  })
  assert.deepEqual(Object.keys(parseCustomHolders(mixed)), ['good'])
})

test('unavailable storage reads as empty and reports a failed write', () => {
  const broken = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
  assert.deepEqual(readCustomHolders(broken), {})
  assert.equal(writeCustomHolders({}, broken), false)
})
