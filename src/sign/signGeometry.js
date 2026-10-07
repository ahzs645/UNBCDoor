import {
  BLEED_INCHES,
  DEFAULT_INSERT_SIZE,
  MARK_INCHES,
  PT_PER_INCH,
  PAPER_DIMENSIONS,
  PAPER_ORDER
} from './signConstants.js'

// Trims trailing zeros so 8.50 -> "8.5" and 11.00 -> "11" in the measurement readout.
export const formatInches = (value) => {
  if (Number.isInteger(value)) {
    return value.toString()
  }
  return value.toFixed(2).replace(/\.00$/, '').replace(/0$/, '')
}

// Derives every measurement the preview needs from the selected card holder (or the default
// insert when none is chosen): the trim/viewable sizes, the CSS custom properties that drive
// the preview frame's aspect ratio.
export const resolveCardHolderGeometry = (selectedCardHolder) => {
  const insertSize = selectedCardHolder?.insertSize || DEFAULT_INSERT_SIZE
  const viewableSize = selectedCardHolder?.viewableSize || insertSize

  const horizontalDifference = Math.max(insertSize.width - viewableSize.width, 0)
  const verticalDifference = Math.max(insertSize.height - viewableSize.height, 0)

  const viewableOffset = selectedCardHolder?.viewableOffset || {
    top: verticalDifference,
    bottom: 0,
    left: horizontalDifference / 2,
    right: horizontalDifference / 2
  }

  // Canvas = trim insert + bleed on every edge. The preview frame matches this canvas; the guides
  // over it are drawn in the artwork's own coordinates (SignGuides).
  const canvasWidth = insertSize.width + BLEED_INCHES * 2
  const canvasHeight = insertSize.height + BLEED_INCHES * 2

  const previewFrameStyle = {
    '--sign-aspect': canvasWidth / canvasHeight
  }

  return { insertSize, viewableSize, viewableOffset, previewFrameStyle }
}

// Oriented sheet dimensions (inches) for an insert: a landscape insert (wider than tall)
// prints on the rotated sheet so the long edge runs horizontally.
const orientedPaper = (paper, orientation) =>
  orientation === 'landscape'
    ? { width: paper.height, height: paper.width }
    : { width: paper.width, height: paper.height }

// True when insert + bleed + crop-mark arms all fit on the (oriented) sheet at 1:1.
const marksFitOn = (paper, insertSize, orientation) => {
  const page = orientedPaper(paper, orientation)
  const needW = insertSize.width + (BLEED_INCHES + MARK_INCHES) * 2
  const needH = insertSize.height + (BLEED_INCHES + MARK_INCHES) * 2
  return needW <= page.width && needH <= page.height
}

// Resolves how an insert lays out on the chosen sheet: orientation (matched to the insert),
// page size in points (for the exporter), whether bleed / crop marks fit at the required 1:1
// scale, and — when they don't — the smallest stock sheet that would. Pure: no DOM, so both
// the export and the warning UI share one source of truth.
export const getPrintLayout = ({ insertSize, paperSize }) => {
  const orientation = insertSize.width >= insertSize.height ? 'landscape' : 'portrait'
  const paper = PAPER_DIMENSIONS[paperSize] || PAPER_DIMENSIONS.letter
  const page = orientedPaper(paper, orientation)

  const artW = insertSize.width + BLEED_INCHES * 2
  const artH = insertSize.height + BLEED_INCHES * 2
  const fitsBleed = artW <= page.width && artH <= page.height
  const fitsMarks = marksFitOn(paper, insertSize, orientation)

  const recommendedPaper = fitsMarks
    ? null
    : (PAPER_ORDER.find((key) => marksFitOn(PAPER_DIMENSIONS[key], insertSize, orientation)) || null)

  return {
    orientation,
    pageWidth: page.width * PT_PER_INCH,
    pageHeight: page.height * PT_PER_INCH,
    fitsBleed,
    fitsMarks,
    recommendedPaper,
    recommendedPaperLabel: recommendedPaper ? PAPER_DIMENSIONS[recommendedPaper].label : null
  }
}
