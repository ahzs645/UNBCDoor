import assert from 'node:assert/strict'
import test from 'node:test'
import { cardHolders } from '../data/cardHolders.js'
import { PT_PER_INCH } from './signConstants.js'
import {
  LOWER_LINES,
  STRIP_HEIGHT_INCHES,
  STRIP_WIDTH_INCHES,
  UPPER_LINES,
  bandHeights,
  buildStripLayout,
  holderFromStripReadings,
  stripReadingsForHolder
} from './stripGeometry.js'

const close = (actual, expected, message) =>
  assert.ok(Math.abs(actual - expected) < 0.001, `${message}: ${actual} != ${expected}`)

test('the strip is wider than every holder and tall enough for every insert', () => {
  for (const [name, holder] of Object.entries(cardHolders)) {
    assert.ok(holder.insertSize.width + 1 <= STRIP_WIDTH_INCHES, `${name} leaves strip showing at both sides`)
    assert.ok(holder.insertSize.height <= UPPER_LINES.to, `${name} height is on a trim line`)
  }
})

test('the strip fits landscape on every sheet at 1:1', () => {
  for (const paperSize of ['letter', 'a4', 'legal', 'tabloid']) {
    const layout = buildStripLayout({ paperSize })
    assert.ok(layout.fits, paperSize)
    close(layout.strip.width, STRIP_WIDTH_INCHES * PT_PER_INCH, `${paperSize} width`)
    close(layout.strip.height, STRIP_HEIGHT_INCHES * PT_PER_INCH, `${paperSize} height`)
  }
})

test('strip coordinates run across from the left end and up from the bottom edge', () => {
  const layout = buildStripLayout({ paperSize: 'letter' })
  const origin = layout.at(0, 0)
  close(origin.x, layout.strip.x, 'left end')
  close(origin.y, layout.strip.y + layout.strip.height, 'bottom edge')
  const point = layout.at(2, 1)
  close(point.x - origin.x, 2 * PT_PER_INCH, 'across')
  close(origin.y - point.y, PT_PER_INCH, 'up')
})

test('height lines step by 0.05" with no float drift', () => {
  const lower = bandHeights(LOWER_LINES)
  assert.equal(lower[0], 0.05)
  assert.equal(lower[lower.length - 1], 1.2)
  assert.ok(bandHeights(UPPER_LINES).includes(3.95))
})

test('readings convert to a holder and back', () => {
  for (const [name, holder] of Object.entries(cardHolders)) {
    const readings = stripReadingsForHolder(holder)
    const result = holderFromStripReadings(readings)
    assert.deepEqual(result.problems, [], name)
    close(result.insertSize.width, holder.insertSize.width, `${name} width`)
    close(result.insertSize.height, holder.insertSize.height, `${name} height`)
    for (const edge of ['top', 'bottom', 'left', 'right']) {
      close(result.viewableOffset[edge], holder.viewableOffset[edge], `${name} ${edge}`)
    }
  }
})

test('the plate can sit anywhere on the ruler', () => {
  const a = holderFromStripReadings({ plateLeft: 1, plateRight: 7.85, windowLeft: 1.55, windowRight: 7.3, cardHeight: 3.94, windowBottom: 0.1, windowTop: 3.74 })
  const b = holderFromStripReadings({ plateLeft: 2.5, plateRight: 9.35, windowLeft: 3.05, windowRight: 8.8, cardHeight: 3.94, windowBottom: 0.1, windowTop: 3.74 })
  assert.deepEqual(a, b)
  close(a.insertSize.width, 6.85, 'card width')
  close(a.viewableSize.width, 5.75, 'window width')
  close(a.viewableOffset.top, 0.2, 'top cover')
})

test('out-of-order readings are flagged', () => {
  const result = holderFromStripReadings({ plateLeft: 2, plateRight: 1, windowLeft: 1.5, windowRight: 1.8, cardHeight: 4, windowBottom: 3, windowTop: 2 })
  assert.equal(result.problems.length, 2)
})
