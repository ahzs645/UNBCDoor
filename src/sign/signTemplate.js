import { jsPDF } from 'jspdf'
import { BLEED_INCHES, SAFE_INCHES, MARK_INCHES, PT_PER_INCH } from './signConstants.js'
import { formatInches } from './signGeometry.js'
import {
  buildTemplateLayout,
  formatDual,
  formatDualSize,
  CALLOUT_CLEARANCE_POINTS,
  TEMPLATE_FOOTER_POINTS
} from './templateGeometry.js'
import {
  ALERT_INK,
  BLEED_INK,
  HIDDEN_FILL,
  HIDDEN_INK,
  INK,
  MUTED,
  PAGE_MARGIN,
  RULE_INK,
  WINDOW_INK,
  dimension,
  drawScaleRulers,
  fileSlug,
  hatch,
  label,
  setDash,
  stroke,
  strokeRect,
  write
} from './pdfPrimitives.js'

// Printable 1:1 measuring template for a known card holder. It carries no sign content — it is
// the ruler you hold against the physical holder: cut on the trim line, drop it in, and the
// hatched bands show exactly how much of the insert the acrylic frame swallows. signGrid.js
// covers the other case, where the holder's size isn't known yet.

const drawHeader = (doc, layout, { holderName, insertSize, viewableSize, hasHolder }) => {
  const printSize = {
    width: insertSize.width + BLEED_INCHES * 2,
    height: insertSize.height + BLEED_INCHES * 2
  }

  write(doc, `Door sign holder template — ${holderName || 'no holder selected'}`, PAGE_MARGIN, 24, {
    size: 12.5, color: INK, style: 'bold'
  })

  const specs = [
    `Insert / trim ${formatDualSize(insertSize)}`,
    hasHolder ? `Viewable window ${formatDualSize(viewableSize)}` : `Safe area inset ${formatDual(SAFE_INCHES)}`,
    `Print size with bleed ${formatInches(printSize.width)}" × ${formatInches(printSize.height)}"`
  ]
  write(doc, specs.join('     ·     '), PAGE_MARGIN, 38, { size: 8, color: MUTED })

  write(
    doc,
    'PRINT AT 100% — set scaling to "Actual size", never "Fit to page". Verify with the rulers at the bottom of this sheet before measuring anything.',
    PAGE_MARGIN,
    50,
    { size: 8, color: ALERT_INK, style: 'bold' }
  )
}

const drawCropMarks = (doc, layout) => {
  const mark = MARK_INCHES * PT_PER_INCH
  const { trim, bleed, gaps } = layout
  const trimRight = trim.x + trim.width
  const trimBottom = trim.y + trim.height
  const bleedRight = bleed.x + bleed.width
  const bleedBottom = bleed.y + bleed.height

  stroke(doc, INK, 0.75)

  if (gaps.left >= mark) {
    doc.line(bleed.x - mark, trim.y, bleed.x, trim.y)
    doc.line(bleed.x - mark, trimBottom, bleed.x, trimBottom)
  }
  if (gaps.right >= mark) {
    doc.line(bleedRight, trim.y, bleedRight + mark, trim.y)
    doc.line(bleedRight, trimBottom, bleedRight + mark, trimBottom)
  }
  if (gaps.top >= mark) {
    doc.line(trim.x, bleed.y - mark, trim.x, bleed.y)
    doc.line(trimRight, bleed.y - mark, trimRight, bleed.y)
  }
  if (gaps.bottom >= mark) {
    doc.line(trim.x, bleedBottom, trim.x, bleedBottom + mark)
    doc.line(trimRight, bleedBottom, trimRight, bleedBottom + mark)
  }
}

// Centre ticks in the bleed margin, so the cut template can be lined up in the holder.
const drawCentreMarks = (doc, layout) => {
  const { trim, bleed } = layout
  const midX = trim.x + trim.width / 2
  const midY = trim.y + trim.height / 2

  stroke(doc, BLEED_INK, 0.5)
  doc.line(midX, bleed.y, midX, trim.y)
  doc.line(midX, trim.y + trim.height, midX, bleed.y + bleed.height)
  doc.line(bleed.x, midY, trim.x, midY)
  doc.line(trim.x + trim.width, midY, bleed.x + bleed.width, midY)

  const target = layout.window || trim
  const cx = target.x + target.width / 2
  const cy = target.y + target.height / 2
  stroke(doc, BLEED_INK, 0.4, [2, 2])
  doc.line(cx - 9, cy, cx + 9, cy)
  doc.line(cx, cy - 9, cx, cy + 9)
  setDash(doc)
}

const drawGuides = (doc, layout) => {
  const { trim, bleed, window: viewable, safe } = layout

  stroke(doc, BLEED_INK, 0.6, [3, 3])
  strokeRect(doc, bleed)
  setDash(doc)

  stroke(doc, INK, 1)
  strokeRect(doc, trim)

  if (viewable) {
    stroke(doc, WINDOW_INK, 1.2)
    strokeRect(doc, viewable)
  } else if (safe) {
    stroke(doc, WINDOW_INK, 0.7, [4, 3])
    strokeRect(doc, safe)
    setDash(doc)
  }

  drawCropMarks(doc, layout)
  drawCentreMarks(doc, layout)
}

// The strips the acrylic frame covers: a tinted, hatched fill with the per-edge coverage
// written into it (rotated on the narrow side bands). Drawn before the guide rectangles so
// the trim and window lines stay unbroken over a label's knockout.
const drawBands = (doc, layout, viewableOffset) => {
  if (layout.bands.length === 0) return

  doc.setFillColor(HIDDEN_FILL[0], HIDDEN_FILL[1], HIDDEN_FILL[2])
  layout.bands.forEach((band) => doc.rect(band.x, band.y, band.width, band.height, 'F'))
  stroke(doc, HIDDEN_INK, 0.3)
  layout.bands.forEach((band) => hatch(doc, band))

  const captions = {
    top: 'Top',
    bottom: 'Bottom',
    left: 'Left',
    right: 'Right'
  }

  layout.bands.forEach((band) => {
    const inches = viewableOffset[band.edge]
    const text = `${captions[band.edge]} ${formatDual(inches)} hidden`
    const vertical = band.edge === 'left' || band.edge === 'right'
    const thickness = vertical ? band.width : band.height
    if (thickness < 7) return

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    const needed = doc.getTextWidth(text) + 6
    if ((vertical ? band.height : band.width) < needed) return

    // Knocked out of the hatch so the value stays readable inside the covered strip.
    label(doc, text, band.x + band.width / 2, band.y + band.height / 2, {
      size: 6.5,
      color: HIDDEN_INK,
      angle: vertical ? 90 : 0
    })
  })
}

// How far outside the bleed a callout sits: close to the guide it measures, but never so
// close that its label collides with the bleed rectangle.
const calloutOffset = (gap) => Math.max(Math.min(gap / 2, 18), 5)

const drawCallouts = (doc, layout, { insertSize, viewableSize, hasHolder }) => {
  const { trim, bleed, window: viewable, gaps } = layout
  const bleedRight = bleed.x + bleed.width
  const bleedBottom = bleed.y + bleed.height

  // Insert (trim) size below and to the right of the artwork.
  if (gaps.bottom >= CALLOUT_CLEARANCE_POINTS) {
    dimension(doc, {
      axis: 'x',
      from: trim.x,
      to: trim.x + trim.width,
      at: bleedBottom + calloutOffset(gaps.bottom),
      edge: bleedBottom,
      text: `Insert / cut size  ${formatDual(insertSize.width)}`
    })
  }
  if (gaps.right >= CALLOUT_CLEARANCE_POINTS) {
    dimension(doc, {
      axis: 'y',
      from: trim.y,
      to: trim.y + trim.height,
      at: bleedRight + calloutOffset(gaps.right),
      edge: bleedRight,
      text: `Insert  ${formatDual(insertSize.height)}`
    })
  }

  if (!hasHolder || !viewable) return

  // Viewable window above and to the left, with leaders running back to the window edges so
  // it's unambiguous which rectangle each measurement belongs to.
  if (gaps.top >= CALLOUT_CLEARANCE_POINTS) {
    dimension(doc, {
      axis: 'x',
      from: viewable.x,
      to: viewable.x + viewable.width,
      at: bleed.y - calloutOffset(gaps.top),
      edge: viewable.y,
      text: `Viewable window  ${formatDual(viewableSize.width)}`,
      color: WINDOW_INK
    })
  }
  if (gaps.left >= CALLOUT_CLEARANCE_POINTS) {
    dimension(doc, {
      axis: 'y',
      from: viewable.y,
      to: viewable.y + viewable.height,
      at: bleed.x - calloutOffset(gaps.left),
      edge: viewable.x,
      text: `Viewable  ${formatDual(viewableSize.height)}`,
      color: WINDOW_INK
    })
  }
}

const drawLegend = (doc, y, hasHolder) => {
  const items = [
    { text: 'Bleed (print edge)', color: BLEED_INK, dash: [3, 3], width: 0.6 },
    { text: 'Trim — cut here', color: INK, dash: [], width: 1 },
    hasHolder
      ? { text: 'Viewable window', color: WINDOW_INK, dash: [], width: 1.2 }
      : { text: `Safe area (${formatDual(SAFE_INCHES)} inset)`, color: WINDOW_INK, dash: [4, 3], width: 0.7 },
    ...(hasHolder ? [{ text: 'Hidden by the holder frame', color: HIDDEN_INK, dash: [1.5, 1.5], width: 0.6 }] : [])
  ]

  let x = PAGE_MARGIN
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)

  items.forEach((item) => {
    stroke(doc, item.color, item.width, item.dash)
    doc.line(x, y - 2.4, x + 16, y - 2.4)
    setDash(doc)
    write(doc, item.text, x + 21, y, { size: 7.5, color: MUTED })
    x += 21 + doc.getTextWidth(item.text) + 18
  })
}

const drawFooter = (doc, { holderNotes, hasHolder, pageWidth, pageHeight }) => {
  const top = pageHeight - TEMPLATE_FOOTER_POINTS

  stroke(doc, RULE_INK, 0.5)
  doc.line(PAGE_MARGIN, top, pageWidth - PAGE_MARGIN, top)

  const steps = hasHolder
    ? 'How to use: 1) print at 100%  2) cut on the solid trim line  3) slide it into the holder  4) trace the frame edge with a pencil  5) compare your traced line to the green window — anything outside it will not be visible on a real sign.'
    : 'How to use: 1) print at 100%  2) cut on the solid trim line  3) drop it into the holder. Select a card holder in the generator to also see its viewable window and frame coverage.'

  write(doc, steps, PAGE_MARGIN, top + 14, { size: 7.5, color: INK })

  drawLegend(doc, top + 28, hasHolder)
  drawScaleRulers(doc, top + 66, pageWidth)

  write(
    doc,
    'Measured on the physical holder —  window:  ______  ×  ______      frame overlap  top ______   bottom ______   left ______   right ______',
    PAGE_MARGIN,
    top + 84,
    { size: 7.5, color: INK }
  )

  const notes = hasHolder && holderNotes
    ? `Preset note: ${holderNotes}`
    : 'Frame coverage in the presets is an estimate. Record your measurements above and update the holder preset if they differ.'
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  const wrapped = doc.splitTextToSize(notes, pageWidth - PAGE_MARGIN * 2).slice(0, 2)
  write(doc, wrapped, PAGE_MARGIN, top + 95, { size: 6.8, color: MUTED })
}

// Draws the template sheet and returns the jsPDF document. Everything on it is derived from
// the same constants and card-holder geometry the preview and the artwork exporters use.
// Separate from the download so the sheet can be rendered outside a browser.
export const buildHolderTemplateDocument = ({
  insertSize,
  viewableSize,
  viewableOffset,
  paperSize,
  holderKey,
  holderName,
  holderNotes
}) => {
  const hasHolder = Boolean(holderKey)
  const layout = buildTemplateLayout({ insertSize, viewableOffset, paperSize, hasHolder })

  const doc = new jsPDF({ orientation: layout.orientation, unit: 'pt', format: paperSize })

  drawHeader(doc, layout, { holderName, insertSize, viewableSize, hasHolder })
  drawBands(doc, layout, viewableOffset)
  drawGuides(doc, layout)
  drawCallouts(doc, layout, { insertSize, viewableSize, hasHolder })
  // Footer positions come from the same layout the guides use so the reserved band, the gap
  // maths, and the drawn content can never disagree about where the page ends.
  drawFooter(doc, {
    holderNotes,
    hasHolder,
    pageWidth: layout.pageWidth,
    pageHeight: layout.pageHeight
  })

  return doc
}

export const exportHolderTemplatePDF = (options) => {
  try {
    buildHolderTemplateDocument(options).save(
      `unbc-door-sign-template-${fileSlug(options.holderKey)}.pdf`
    )
  } catch (error) {
    console.error('Error exporting holder template:', error)
  }
}
