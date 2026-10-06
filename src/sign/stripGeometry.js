// The measuring strip: a printed strip wider than any door plate, slid through a holder's side
// slot to measure it without tracing anything. Two scales are printed on it:
//
//   * across — a ruler numbered from the strip's left end. Read where the plate's left and right
//     edges fall (the card runs the plate's full width) and where the window's edges fall;
//   * up — lines numbered by their height above the strip's bottom edge. Trim the top down a line
//     at a time until the strip slides in; that line is the card height. Through the window, read
//     where the window's bottom and top edges fall.
//
// Pure layout and arithmetic, so it can be unit-tested; signStrip.js draws it.

import { PAPER_DIMENSIONS, PT_PER_INCH } from './signConstants.js'
import { PAGE_MARGIN } from './templateGeometry.js'

export const STRIP_WIDTH_INCHES = 10
// Tall enough for the legacy 5.5" inserts; the current ones are ~4".
export const STRIP_HEIGHT_INCHES = 5.6
export const STRIP_STEP_INCHES = 0.05

// The bands of height lines: the window's bottom edge falls in the lower one, its top edge and
// the trim lines in the upper one. The across ruler sits between them.
export const LOWER_LINES = { from: STRIP_STEP_INCHES, to: 1.2 }
export const UPPER_LINES = { from: 3.3, to: STRIP_HEIGHT_INCHES - STRIP_STEP_INCHES }
export const RULER_HEIGHT_INCHES = 2

export const STRIP_TOP_POINTS = 56

// Heights (inches above the bottom edge) of every printed line in a band, without float drift.
export const bandHeights = ({ from, to }, step = STRIP_STEP_INCHES) => {
  const first = Math.round(from / step)
  const last = Math.round(to / step)
  return Array.from({ length: last - first + 1 }, (_, index) => Number(((first + index) * step).toFixed(4)))
}

// Always landscape: the strip's long edge needs the long edge of the sheet.
export const buildStripLayout = ({ paperSize = 'letter' } = {}) => {
  const paper = PAPER_DIMENSIONS[paperSize] || PAPER_DIMENSIONS.letter
  const pageWidth = paper.height * PT_PER_INCH
  const pageHeight = paper.width * PT_PER_INCH
  const width = STRIP_WIDTH_INCHES * PT_PER_INCH
  const height = STRIP_HEIGHT_INCHES * PT_PER_INCH
  const strip = {
    x: (pageWidth - width) / 2,
    y: STRIP_TOP_POINTS,
    width,
    height
  }

  return {
    orientation: 'landscape',
    pageWidth,
    pageHeight,
    strip,
    fits: strip.x >= PAGE_MARGIN / 2 && strip.y + strip.height <= pageHeight - PAGE_MARGIN * 2.5,
    // Page coordinates of a point given in strip inches: across from the left end, up from the
    // bottom edge.
    at: (across, up) => ({
      x: strip.x + across * PT_PER_INCH,
      y: strip.y + strip.height - up * PT_PER_INCH
    })
  }
}

const round = (value) => Number(value.toFixed(3))

/**
 * Turns the strip readings into holder geometry (inches).
 *
 * @param {object} readings
 * @param {number} readings.plateLeft    across-ruler reading at the plate's left edge (0 if the
 *                                       slot is closed on the left and the strip was pushed in to
 *                                       the stop)
 * @param {number} readings.plateRight   across-ruler reading at the plate's right edge
 * @param {number} readings.windowLeft   across-ruler reading at the window's left edge
 * @param {number} readings.windowRight  across-ruler reading at the window's right edge
 * @param {number} readings.cardHeight   the last trim line that still let the strip slide in
 * @param {number} readings.windowBottom height line at the window's bottom edge
 * @param {number} readings.windowTop    height line at the window's top edge
 */
export const holderFromStripReadings = ({
  plateLeft,
  plateRight,
  windowLeft,
  windowRight,
  cardHeight,
  windowBottom,
  windowTop
}) => {
  const problems = []
  if (!(plateLeft <= windowLeft && windowLeft < windowRight && windowRight <= plateRight)) {
    problems.push('Across, the readings should run plate left ≤ window left < window right ≤ plate right.')
  }
  if (!(windowBottom >= 0 && windowBottom < windowTop && windowTop <= cardHeight)) {
    problems.push('Up, the readings should run 0 ≤ window bottom < window top ≤ card height.')
  }

  const insertSize = { width: round(plateRight - plateLeft), height: round(cardHeight) }
  const viewableOffset = {
    top: round(cardHeight - windowTop),
    bottom: round(windowBottom),
    left: round(windowLeft - plateLeft),
    right: round(plateRight - windowRight)
  }
  const viewableSize = {
    width: round(windowRight - windowLeft),
    height: round(windowTop - windowBottom)
  }

  return { insertSize, viewableOffset, viewableSize, problems }
}

// The strip readings a holder would give, with the plate's left edge at `plateLeft` on the
// ruler — the inverse of holderFromStripReadings, used to prefill the form from a preset.
export const stripReadingsForHolder = ({ insertSize, viewableOffset }, plateLeft = 1.5) => ({
  plateLeft,
  plateRight: round(plateLeft + insertSize.width),
  windowLeft: round(plateLeft + viewableOffset.left),
  windowRight: round(plateLeft + insertSize.width - viewableOffset.right),
  cardHeight: insertSize.height,
  windowBottom: viewableOffset.bottom,
  windowTop: round(insertSize.height - viewableOffset.top)
})
