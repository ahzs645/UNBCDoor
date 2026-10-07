import assert from 'node:assert/strict'
import test from 'node:test'
import { formatLength, formatSize } from './units.js'

test('lengths read in millimetres or inches', () => {
  assert.equal(formatLength(6.97, 'mm'), '177 mm')
  assert.equal(formatLength(0.512, 'mm'), '13 mm')
  assert.equal(formatLength(6.97, 'in'), '6.97"')
  assert.equal(formatSize(7.677, 3.976, 'mm'), '195 × 101 mm')
  assert.equal(formatSize(8.5, 5.5, 'in'), '8.5" × 5.5"')
})
