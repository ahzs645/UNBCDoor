import assert from 'node:assert/strict'
import test from 'node:test'
import { countSignTypes, describeSignEntry, filterSignEntries, signDataDiffers } from './signArchiveSearch.js'

const entries = [
  { id: 'a', label: '10-3540 — Near-Infrared Lab', signData: { signType: 'lab', mainDepartment: 'School of Health Sciences', roomName: 'Near-Infrared Lab', cardHolderType: 'Building 10' } },
  { id: 'b', label: 'Ann Duong — Sustainability Manager', signData: { signType: 'staff', name: 'Ann Duong', email: 'ann.duong@unbc.ca' } },
  { id: 'c', label: 'Thérèse Lab Manager', signData: { signType: 'staff', name: 'Thérèse', position: 'Lab manager' } }
]

test('returns every entry for an empty query', () => {
  assert.deepEqual(filterSignEntries(entries, '  ').map(e => e.id), ['a', 'b', 'c'])
})

test('matches every term across label and sign fields', () => {
  assert.deepEqual(filterSignEntries(entries, 'health infrared').map(e => e.id), ['a'])
  assert.deepEqual(filterSignEntries(entries, 'ann.duong@').map(e => e.id), ['b'])
})

test('ignores case and accents', () => {
  assert.deepEqual(filterSignEntries(entries, 'THERESE').map(e => e.id), ['c'])
})

test('ranks label prefix matches ahead of other matches', () => {
  assert.deepEqual(filterSignEntries(entries, 'lab').map(e => e.id), ['a', 'c'])
  assert.deepEqual(filterSignEntries(entries, 'thé').map(e => e.id), ['c'])
})

test('ranks word-start matches ahead of matches inside a word', () => {
  const people = [
    { id: 'shelley', label: 'Shelley Bryant', signData: {} },
    { id: 'helle', label: 'Steve Helle — Associate Professor', signData: {} }
  ]
  assert.deepEqual(filterSignEntries(people, 'helle').map(e => e.id), ['helle', 'shelley'])
})

test('filters by sign type', () => {
  assert.deepEqual(filterSignEntries(entries, '', { signType: 'staff' }).map(e => e.id), ['b', 'c'])
  assert.deepEqual(filterSignEntries(entries, 'lab', { signType: 'staff' }).map(e => e.id), ['c'])
})

test('describes and counts entries', () => {
  assert.equal(describeSignEntry(entries[0]), 'Lab · School of Health Sciences · Building 10')
  assert.deepEqual(countSignTypes(entries), { lab: 1, staff: 2 })
})

test('treats reordered keys as unchanged and value changes as edits', () => {
  assert.equal(signDataDiffers({ a: 1, b: ['x'] }, { b: ['x'], a: 1 }), false)
  assert.equal(signDataDiffers({ a: 1 }, { a: 2 }), true)
  assert.equal(signDataDiffers({ b: ['x'] }, { b: ['x', 'y'] }), true)
})
