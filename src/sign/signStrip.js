import { jsPDF } from 'jspdf'
import { PT_PER_INCH } from './signConstants.js'
import { MM_PER_INCH } from './templateGeometry.js'
import {
  LOWER_LINES,
  RULER_HEIGHT_INCHES,
  STRIP_HEIGHT_INCHES,
  STRIP_STEP_INCHES,
  STRIP_WIDTH_INCHES,
  UPPER_LINES,
  bandHeights,
  buildStripLayout
} from './stripGeometry.js'
import {
  ALERT_INK,
  GRID_FINE_INK,
  GRID_MAJOR_INK,
  INK,
  MUTED,
  PAGE_MARGIN,
  RULE_INK,
  WINDOW_INK,
  drawScaleRulers,
  label,
  setDash,
  stroke,
  write
} from './pdfPrimitives.js'

// The measuring strip (see stripGeometry.js): slide it through a holder's side slot and read the
// plate, the window and the card height straight off it — no tracing, no cutting to width. Page
// two is a survey table for writing down a round of holders.

// Where the height lines carry their numbers: both ends (outside the plate) and a few columns
// that land inside the window.
const HEIGHT_LABEL_COLUMNS = [0.22, 2.5, 5, 7.5, STRIP_WIDTH_INCHES - 0.22]

const isMultiple = (value, step) => Math.abs(value / step - Math.round(value / step)) < 1e-6

const drawHeightLines = (doc, layout, band) => {
  const left = layout.at(0, 0).x
  const right = layout.at(STRIP_WIDTH_INCHES, 0).x

  bandHeights(band).forEach((height) => {
    const { y } = layout.at(0, height)
    const tenth = isMultiple(height, 0.1)
    const half = isMultiple(height, 0.5)
    stroke(doc, tenth ? GRID_MAJOR_INK : GRID_FINE_INK, half ? 0.6 : tenth ? 0.4 : 0.3)
    doc.line(left, y, right, y)
  })

  bandHeights(band).filter((height) => isMultiple(height, 0.1)).forEach((height) => {
    const { y } = layout.at(0, height)
    HEIGHT_LABEL_COLUMNS.forEach((across) => {
      label(doc, height.toFixed(2), layout.at(across, 0).x, y, {
        size: 4.6,
        color: isMultiple(height, 0.5) ? INK : MUTED,
        style: isMultiple(height, 0.5) ? 'bold' : 'normal'
      })
    })
  })
}

// The across ruler: inches (0.05" ticks) above the line, millimetres below, both numbered from
// the strip's left end.
const drawAcrossRuler = (doc, layout) => {
  const { y } = layout.at(0, RULER_HEIGHT_INCHES)
  const left = layout.at(0, 0).x
  const right = layout.at(STRIP_WIDTH_INCHES, 0).x

  stroke(doc, INK, 0.7)
  doc.line(left, y, right, y)

  const steps = Math.round(STRIP_WIDTH_INCHES / STRIP_STEP_INCHES)
  for (let step = 0; step <= steps; step += 1) {
    const inches = step * STRIP_STEP_INCHES
    const x = left + inches * PT_PER_INCH
    const whole = step % 20 === 0
    const half = step % 10 === 0
    const tenth = step % 2 === 0
    stroke(doc, INK, whole ? 0.7 : half ? 0.55 : 0.35)
    doc.line(x, y, x, y - (whole ? 16 : half ? 11 : tenth ? 7 : 4))
    if (half) {
      write(doc, Number(inches.toFixed(1)).toString(), x, y - 20, {
        size: whole ? 8 : 6.5, color: INK, style: whole ? 'bold' : 'normal', align: 'center'
      })
    }
  }
  write(doc, 'inches', right - 4, y - 28, { size: 6, color: MUTED, align: 'right' })

  const perMm = PT_PER_INCH / MM_PER_INCH
  const millimetres = Math.floor(STRIP_WIDTH_INCHES * MM_PER_INCH)
  for (let mm = 0; mm <= millimetres; mm += 1) {
    const x = left + mm * perMm
    const ten = mm % 10 === 0
    stroke(doc, ten ? INK : GRID_MAJOR_INK, ten ? 0.5 : 0.3)
    doc.line(x, y, x, y + (ten ? 10 : mm % 5 === 0 ? 6.5 : 3.5))
    if (ten && mm > 0) {
      write(doc, `${mm}`, x, y + 17, { size: 5, color: MUTED, align: 'center' })
    }
  }
  write(doc, 'mm', right - 4, y + 25, { size: 6, color: MUTED, align: 'right' })
}

const drawStripText = (doc, layout) => {
  const at = (across, up) => layout.at(across, up)

  const lower = at(0.3, LOWER_LINES.to + 0.18)
  write(doc, 'LOWER LINES — the window\'s bottom edge falls here: that number is how much the frame hides at the bottom.', lower.x, lower.y, {
    size: 6.8, color: WINDOW_INK, style: 'bold'
  })

  const upper = at(0.3, UPPER_LINES.from - 0.12)
  write(doc, 'UPPER LINES — trim from the top, one line at a time, until the strip slides in snugly: the last line is the card height. Then read the window top edge.', upper.x, upper.y, {
    size: 6.8, color: WINDOW_INK, style: 'bold'
  })

  const middle = at(0.3, RULER_HEIGHT_INCHES + 0.62)
  write(doc, 'ACROSS RULER — read the plate\'s left and right edges, then the window\'s left and right edges, on this ruler.', middle.x, middle.y, {
    size: 6.8, color: INK
  })
}

const drawStripPage = (doc, layout) => {
  const { strip, pageWidth, pageHeight } = layout

  write(doc, 'Door sign holder measuring strip', PAGE_MARGIN, 24, { size: 12.5, color: INK, style: 'bold' })
  write(
    doc,
    `${STRIP_WIDTH_INCHES}" × ${STRIP_HEIGHT_INCHES}" strip — wider than any plate, so it slides through the side slot and shows at both ends.  Page 2 is a survey table.`,
    PAGE_MARGIN,
    37,
    { size: 8, color: MUTED }
  )
  write(
    doc,
    'PRINT AT 100% — "Actual size", never "Fit to page". Check the scale bars at the bottom first. Cut only on the solid outline.',
    PAGE_MARGIN,
    48,
    { size: 8, color: ALERT_INK, style: 'bold' }
  )

  drawHeightLines(doc, layout, LOWER_LINES)
  drawHeightLines(doc, layout, UPPER_LINES)
  drawAcrossRuler(doc, layout)
  drawStripText(doc, layout)

  // Cut outline last, so nothing is drawn over it.
  stroke(doc, INK, 1)
  doc.rect(strip.x, strip.y, strip.width, strip.height, 'S')

  const bottom = strip.y + strip.height
  write(doc, 'BOTTOM EDGE — the 0 line for every height. Keep it straight; slide it in bottom edge down.', strip.x, bottom + 11, {
    size: 7, color: INK, style: 'bold'
  })

  const steps = [
    'How to use: 1) print at 100% and cut out the strip on the solid outline  2) slide it into the holder from the side, bottom edge down, until it shows at both ends',
    '3) read the plate edges and window edges on the across ruler  4) trim the top a line at a time until it slides in; note the last line  5) read where the window\'s bottom and top edges fall',
    'Slot closed on one side? Push the 0 end in until it stops and use 0 for that plate edge. Write each holder on page 2, then enter the readings on the Measuring sheets page for a preset.'
  ]
  steps.forEach((line, index) => {
    write(doc, line, PAGE_MARGIN, bottom + 26 + index * 10, { size: 7.2, color: index === 2 ? MUTED : INK })
  })

  drawScaleRulers(doc, pageHeight - 22, pageWidth)
}

const SURVEY_COLUMNS = [
  { title: 'Room / building', width: 1.35 },
  { title: 'Plate', sub: 'number only / grey / green', width: 1.25 },
  { title: 'Plate edges', sub: 'left  |  right', width: 1.2 },
  { title: 'Window edges', sub: 'left  |  right', width: 1.2 },
  { title: 'Card height', sub: 'last trim line', width: 0.9 },
  { title: 'Window lines', sub: 'bottom  |  top', width: 1.2 },
  { title: 'Notes', width: 2.9 }
]

const drawSurveyPage = (doc, layout) => {
  const { pageWidth, pageHeight } = layout
  doc.addPage(undefined, 'landscape')

  write(doc, 'Holder survey', PAGE_MARGIN, 24, { size: 12.5, color: INK, style: 'bold' })
  write(doc, 'One row per holder. Readings straight off the measuring strip, in inches (or mm — just say which).', PAGE_MARGIN, 37, { size: 8, color: MUTED })

  const totalWidth = SURVEY_COLUMNS.reduce((sum, column) => sum + column.width, 0)
  const scale = (pageWidth - PAGE_MARGIN * 2) / (totalWidth * PT_PER_INCH)
  const top = 52
  const headerHeight = 26
  const footerSpace = 66
  const rows = Math.floor((pageHeight - top - headerHeight - footerSpace) / 26)
  const rowHeight = (pageHeight - top - headerHeight - footerSpace) / rows

  let x = PAGE_MARGIN
  const xs = SURVEY_COLUMNS.map((column) => {
    const start = x
    x += column.width * PT_PER_INCH * scale
    return { ...column, x: start, w: column.width * PT_PER_INCH * scale }
  })
  const right = x
  const bottom = top + headerHeight + rows * rowHeight

  doc.setFillColor(244, 246, 245)
  doc.rect(PAGE_MARGIN, top, right - PAGE_MARGIN, headerHeight, 'F')
  xs.forEach((column) => {
    write(doc, column.title, column.x + 5, top + 11, { size: 7.8, color: INK, style: 'bold' })
    if (column.sub) write(doc, column.sub, column.x + 5, top + 21, { size: 6.3, color: MUTED })
  })

  stroke(doc, GRID_MAJOR_INK, 0.5)
  doc.rect(PAGE_MARGIN, top, right - PAGE_MARGIN, bottom - top, 'S')
  for (let row = 0; row <= rows; row += 1) {
    const y = top + headerHeight + row * rowHeight
    stroke(doc, row === 0 ? GRID_MAJOR_INK : RULE_INK, row === 0 ? 0.6 : 0.5)
    doc.line(PAGE_MARGIN, y, right, y)
  }
  xs.slice(1).forEach((column) => {
    stroke(doc, GRID_FINE_INK, 0.5)
    doc.line(column.x, top, column.x, bottom)
  })
  // The paired columns get a centre divider for their two readings.
  xs.filter((column) => column.sub?.includes('|')).forEach((column) => {
    stroke(doc, RULE_INK, 0.4, [1.5, 1.5])
    doc.line(column.x + column.w / 2, top + headerHeight, column.x + column.w / 2, bottom)
    setDash(doc)
  })

  const formulas = [
    'Card width = plate right - plate left.   Window width = window right - window left.   Hidden left = window left - plate left.   Hidden right = plate right - window right.',
    'Hidden bottom = window bottom line.   Hidden top = card height - window top line.   Window height = window top - window bottom.',
    'On the Measuring sheets page, the Measuring strip sheet does this arithmetic for you and writes the preset.'
  ]
  formulas.forEach((line, index) => {
    write(doc, line, PAGE_MARGIN, bottom + 16 + index * 11, { size: 7.3, color: index === 2 ? MUTED : INK })
  })
}

export const buildMeasuringStripDocument = ({ paperSize = 'letter' } = {}) => {
  const layout = buildStripLayout({ paperSize })
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: paperSize })
  drawStripPage(doc, layout)
  drawSurveyPage(doc, layout)
  return doc
}
