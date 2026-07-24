import assert from 'node:assert/strict'
import test from 'node:test'
import { BLEED_INCHES, SAFE_INCHES, PT_PER_INCH } from './signConstants.js'
import { buildTemplateLayout, formatDual, formatDualSize } from './templateGeometry.js'

const holder = {
  insertSize: { width: 6.97, height: 4.17 },
  viewableOffset: { top: 0.2, bottom: 0.1, left: 0.15, right: 0.15 }
}

const close = (actual, expected, message) =>
  assert.ok(Math.abs(actual - expected) < 0.001, `${message}: ${actual} != ${expected}`)

test('trim box is centred horizontally and sized to the insert', () => {
  const layout = buildTemplateLayout({ ...holder, paperSize: 'letter' })

  close(layout.trim.width, 6.97 * PT_PER_INCH, 'trim width')
  close(layout.trim.height, 4.17 * PT_PER_INCH, 'trim height')
  close(layout.trim.x + layout.trim.width / 2, layout.pageWidth / 2, 'trim centre')
  assert.ok(layout.trim.y > 0 && layout.trim.y + layout.trim.height < layout.pageHeight, 'trim on page')
})

test('bleed box surrounds the trim by the bleed margin on every edge', () => {
  const { trim, bleed } = buildTemplateLayout({ ...holder, paperSize: 'letter' })
  const bleedPoints = BLEED_INCHES * PT_PER_INCH

  close(trim.x - bleed.x, bleedPoints, 'left bleed')
  close(trim.y - bleed.y, bleedPoints, 'top bleed')
  close(bleed.x + bleed.width - (trim.x + trim.width), bleedPoints, 'right bleed')
  close(bleed.y + bleed.height - (trim.y + trim.height), bleedPoints, 'bottom bleed')
})

test('viewable window is the trim inset by the holder frame offsets', () => {
  const { trim, window: viewable, hasWindow } = buildTemplateLayout({ ...holder, paperSize: 'letter' })

  assert.equal(hasWindow, true)
  close(viewable.x - trim.x, 0.15 * PT_PER_INCH, 'left offset')
  close(viewable.y - trim.y, 0.2 * PT_PER_INCH, 'top offset')
  close(viewable.width, (6.97 - 0.3) * PT_PER_INCH, 'window width')
  close(viewable.height, (4.17 - 0.3) * PT_PER_INCH, 'window height')
})

test('hidden bands tile the gap between the trim and the window without overlapping', () => {
  const { trim, window: viewable, bands } = buildTemplateLayout({ ...holder, paperSize: 'letter' })

  assert.equal(bands.length, 4)
  const covered = bands.reduce((total, band) => total + band.width * band.height, 0)
  close(covered, trim.width * trim.height - viewable.width * viewable.height, 'hidden area')
  bands.forEach((band) => {
    assert.ok(band.width > 0 && band.height > 0, `${band.edge} band has area`)
  })
})

test('falls back to the safe area when no holder is selected', () => {
  const layout = buildTemplateLayout({
    insertSize: holder.insertSize,
    viewableOffset: { top: 0, bottom: 0, left: 0, right: 0 },
    paperSize: 'letter',
    hasHolder: false
  })

  assert.equal(layout.hasWindow, false)
  assert.equal(layout.window, null)
  assert.equal(layout.bands.length, 0)
  close(layout.safe.x - layout.trim.x, SAFE_INCHES * PT_PER_INCH, 'safe inset')
})

test('a selected holder with no measured frame coverage draws no window', () => {
  const layout = buildTemplateLayout({
    insertSize: holder.insertSize,
    viewableOffset: { top: 0, bottom: 0, left: 0, right: 0 },
    paperSize: 'letter'
  })

  assert.equal(layout.hasWindow, false)
  assert.notEqual(layout.safe, null)
})

test('measurements are labelled in both inches and millimetres', () => {
  assert.equal(formatDual(6.97), '6.97" (177 mm)')
  assert.equal(formatDual(0.125), '0.13" (3.2 mm)')
  assert.equal(formatDualSize({ width: 8.5, height: 5.5 }), '8.5" × 5.5"  (215.9 × 139.7 mm)')
})
