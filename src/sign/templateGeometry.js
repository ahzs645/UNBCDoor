// Node's test runner resolves these specifiers directly, so the sign modules this file (and
// its test) reach for are imported with explicit extensions.
import { BLEED_INCHES, SAFE_INCHES, PT_PER_INCH } from './signConstants.js'
import { formatInches, getPrintLayout } from './signGeometry.js'

// Pure geometry + label helpers for the printable holder template. Kept free of jsPDF and the
// DOM so the layout maths can be unit-tested; signTemplate.js does the drawing.

export const MM_PER_INCH = 25.4

// Header/footer bands reserved on the sheet. The trim box is centred in what's left over so
// the dimension callouts and the scale-check rulers can never overlap the guides.
export const TEMPLATE_HEADER_POINTS = 58
export const TEMPLATE_FOOTER_POINTS = 116

// Clearance a dimension callout needs between the bleed edge and the reserved band. A big
// insert on a small sheet (the legacy 8.5" × 5.5" one on Letter) leaves barely a pica there,
// which is still enough for an arrowed line and its label.
export const CALLOUT_CLEARANCE_POINTS = 11

export const formatMillimetres = (value) => {
  const rounded = Math.round(value * MM_PER_INCH * 10) / 10
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1)
}

// "6.97" (177 mm)" — every measurement on the sheet is printed in both units so it can be
// checked with whichever ruler is at hand.
export const formatDual = (value) => `${formatInches(value)}" (${formatMillimetres(value)} mm)`

export const formatDualSize = ({ width, height }) =>
  `${formatInches(width)}" × ${formatInches(height)}"  (${formatMillimetres(width)} × ${formatMillimetres(height)} mm)`

const inset = (rect, amount) => ({
  x: rect.x + amount,
  y: rect.y + amount,
  width: rect.width - amount * 2,
  height: rect.height - amount * 2
})

// Resolves every rectangle the template sheet draws, in PDF points from the top-left of the
// page: the bleed and trim boxes, the holder's viewable window, the frame-covered bands
// between them, and the safe area used when no holder is selected.
export const buildTemplateLayout = ({ insertSize, viewableOffset, paperSize, hasHolder = true }) => {
  const print = getPrintLayout({ insertSize, paperSize })
  const { pageWidth, pageHeight } = print

  const bleedPoints = BLEED_INCHES * PT_PER_INCH
  const trimWidth = insertSize.width * PT_PER_INCH
  const trimHeight = insertSize.height * PT_PER_INCH

  // Centre the trim box between the reserved bands when it fits there; otherwise fall back to
  // centring on the sheet (the print-fit warning already covers that case).
  const regionHeight = pageHeight - TEMPLATE_HEADER_POINTS - TEMPLATE_FOOTER_POINTS
  const fitsRegion = regionHeight >= trimHeight + bleedPoints * 2
  const trim = {
    x: (pageWidth - trimWidth) / 2,
    y: fitsRegion
      ? TEMPLATE_HEADER_POINTS + (regionHeight - trimHeight) / 2
      : (pageHeight - trimHeight) / 2,
    width: trimWidth,
    height: trimHeight
  }

  const bleed = inset(trim, -bleedPoints)

  const offsets = {
    top: Math.max(viewableOffset?.top || 0, 0) * PT_PER_INCH,
    bottom: Math.max(viewableOffset?.bottom || 0, 0) * PT_PER_INCH,
    left: Math.max(viewableOffset?.left || 0, 0) * PT_PER_INCH,
    right: Math.max(viewableOffset?.right || 0, 0) * PT_PER_INCH
  }

  const windowRect = {
    x: trim.x + offsets.left,
    y: trim.y + offsets.top,
    width: trim.width - offsets.left - offsets.right,
    height: trim.height - offsets.top - offsets.bottom
  }

  const coversAnything = offsets.top + offsets.bottom + offsets.left + offsets.right > 0
  const hasWindow = hasHolder && coversAnything && windowRect.width > 0 && windowRect.height > 0

  // The four strips the acrylic frame hides, as non-overlapping rectangles inside the trim.
  const bands = hasWindow
    ? [
      { edge: 'top', x: trim.x, y: trim.y, width: trim.width, height: offsets.top },
      { edge: 'bottom', x: trim.x, y: windowRect.y + windowRect.height, width: trim.width, height: offsets.bottom },
      { edge: 'left', x: trim.x, y: windowRect.y, width: offsets.left, height: windowRect.height },
      { edge: 'right', x: windowRect.x + windowRect.width, y: windowRect.y, width: offsets.right, height: windowRect.height }
    ].filter((band) => band.width > 0 && band.height > 0)
    : []

  return {
    ...print,
    bleedPoints,
    trim,
    bleed,
    // Without a holder there's no window to show, so the sheet falls back to the same safe
    // area the on-screen preview draws (trim inset by the safe margin).
    window: hasWindow ? windowRect : null,
    safe: hasWindow ? null : inset(trim, SAFE_INCHES * PT_PER_INCH),
    bands,
    offsets,
    hasWindow,
    // Space between the bleed edge and each reserved band — a callout is only drawn when the
    // gap on that side can hold it.
    gaps: {
      top: bleed.y - TEMPLATE_HEADER_POINTS,
      bottom: pageHeight - TEMPLATE_FOOTER_POINTS - (bleed.y + bleed.height),
      left: bleed.x,
      right: pageWidth - (bleed.x + bleed.width)
    }
  }
}
