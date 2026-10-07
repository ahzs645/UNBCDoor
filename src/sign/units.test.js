import assert from 'node:assert/strict'
import test from 'node:test'
import { formatLength, formatSize, formatSizeBoth } from './units.js'

test('lengths read in millimetres or inches', () => {
  assert.equal(formatLength(6.97, 'mm'), '177 mm')
  assert.equal(formatLength(0.512, 'mm'), '13 mm')
  assert.equal(formatLength(6.97, 'in'), '6.97"')
  assert.equal(formatSize(7.677, 3.976, 'mm'), '195 × 101 mm')
  assert.equal(formatSize(8.5, 5.5, 'in'), '8.5" × 5.5"')
})

test('a size reads in the chosen units first, then the other', () => {
  assert.equal(formatSizeBoth({ width: 6.97, height: 4.17 }, 'mm'), '177 × 105.9 mm (6.97" × 4.17")')
  assert.equal(formatSizeBoth({ width: 6.97, height: 4.17 }, 'in'), '6.97" × 4.17" (177 × 105.9 mm)')
})
