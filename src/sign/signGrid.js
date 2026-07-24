import { jsPDF } from 'jspdf'
import { PT_PER_INCH } from './signConstants.js'
import { formatInches } from './signGeometry.js'
import {
  GRID_FOOTER_POINTS,
  GRID_SUBDIVISIONS,
  MM_PER_INCH,
  buildGridLayout,
  buildPresetOutlines
} from './templateGeometry.js'
import {
  ALERT_INK,
  GRID_FINE_INK,
  GRID_MAJOR_INK,
  INK,
  MUTED,
  PAGE_MARGIN,
  PRESET_INKS,
  RULE_INK,
  drawInchGrid,
  drawInteriorCoordinates,
  label,
  setDash,
  stroke,
  write
} from './pdfPrimitives.js'

// The sheet for a holder nobody has measured yet: a 1" grid, numbered from the top-left
// corner, that you cut down with scissors until it slides into the holder — then read the
// insert size straight off the numbers. The known presets are drawn over the grid from the
// same corner, so a cut sheet also shows which preset (if any) the holder matches.
//
// signTemplate.js is the other half of this: once the holder is known, that sheet prints its
// exact geometry.

const NUMBER_SIZE = 7
// The inch numbers own the first 13pt of the gutter; the millimetre scale lives beyond them.
const MM_BASE_POINTS = 14
const MM_TICK_POINTS = 9

// Millimetre ticks along the outside of the grid's origin edges, for holders specified in
// metric (the production inserts are 177 × 106 mm and friends).
const drawMillimetreTicks = (doc, layout) => {
  const { grid } = layout
  const perMm = PT_PER_INCH / MM_PER_INCH
  const across = Math.floor((grid.width / PT_PER_INCH) * MM_PER_INCH)
  const down = Math.floor((grid.height / PT_PER_INCH) * MM_PER_INCH)

  const tickLength = (millimetres) =>
    (millimetres % 50 === 0 ? MM_TICK_POINTS : millimetres % 10 === 0 ? 6 : 3)

  for (let mm = 0; mm <= across; mm += 5) {
    const x = grid.x + mm * perMm
    stroke(doc, mm % 10 === 0 ? GRID_MAJOR_INK : GRID_FINE_INK, 0.4)
    doc.line(x, grid.y - MM_BASE_POINTS, x, grid.y - MM_BASE_POINTS - tickLength(mm))
    if (mm % 50 === 0 && mm > 0) {
      write(doc, `${mm}`, x, grid.y - MM_BASE_POINTS - MM_TICK_POINTS - 2, {
        size: 5.5, color: MUTED, align: 'center'
      })
    }
  }

  for (let mm = 0; mm <= down; mm += 5) {
    const y = grid.y + mm * perMm
    stroke(doc, mm % 10 === 0 ? GRID_MAJOR_INK : GRID_FINE_INK, 0.4)
    doc.line(grid.x - MM_BASE_POINTS, y, grid.x - MM_BASE_POINTS - tickLength(mm), y)
    if (mm % 50 === 0 && mm > 0) {
      write(doc, `${mm}`, grid.x - MM_BASE_POINTS - MM_TICK_POINTS - 2, y + 2, {
        size: 5.5, color: MUTED, align: 'right'
      })
    }
  }

  write(doc, 'mm', grid.x - MM_BASE_POINTS, grid.y - MM_BASE_POINTS - MM_TICK_POINTS - 2, {
    size: 5.5, color: MUTED, align: 'right'
  })
}

const drawGrid = (doc, layout) => {
  const { grid, columns, rows, cell } = layout

  drawInchGrid(doc, grid, { subdivisions: GRID_SUBDIVISIONS })

  // Inch numbers on all four edges: whichever pair of edges survives the scissors, the
  // distance from the origin corner can still be read off.
  for (let column = 0; column <= columns; column += 1) {
    const x = grid.x + column * cell
    write(doc, `${column}`, x, grid.y - 4, { size: NUMBER_SIZE, color: INK, align: 'center' })
    write(doc, `${column}`, x, grid.y + grid.height + 9, { size: NUMBER_SIZE, color: MUTED, align: 'center' })
  }
  for (let row = 0; row <= rows; row += 1) {
    const y = grid.y + row * cell
    write(doc, `${row}`, grid.x - 5, y + 2.5, { size: NUMBER_SIZE, color: INK, align: 'right' })
    write(doc, `${row}`, grid.x + grid.width + 5, y + 2.5, { size: NUMBER_SIZE, color: MUTED, align: 'left' })
  }

  write(doc, 'inches', grid.x + grid.width + 5, grid.y - 5, { size: 6, color: MUTED })

  // …and repeated across the middle, so an offcut that keeps none of the edges still says how
  // far across and down it came from.
  drawInteriorCoordinates(doc, grid)
}

// The corner every number is measured from, plus the first cell doubling as the scale check.
// Drawn after the preset outlines, which all start at this same corner, so it stays on top.
const drawOrigin = (doc, layout) => {
  const { grid, cell } = layout

  stroke(doc, INK, 1.6)
  doc.line(grid.x, grid.y, grid.x + cell, grid.y)
  doc.line(grid.x, grid.y, grid.x, grid.y + cell)

  label(doc, 'START HERE', grid.x + cell / 2, grid.y + cell / 2 - 6, {
    size: 6.5,
    color: ALERT_INK,
    style: 'bold'
  })
  label(doc, 'this square = 1 in = 25.4 mm', grid.x + cell / 2, grid.y + cell / 2 + 6, {
    size: 5,
    color: MUTED
  })
}

// Known presets, all anchored to the grid origin, each tagged with a numbered badge at its
// far corner and keyed to the legend in the footer.
const drawPresetOutlines = (doc, outlines) => {
  outlines.forEach(({ rect, index }) => {
    const color = PRESET_INKS[index % PRESET_INKS.length]
    stroke(doc, color, 1, [5, 3])
    doc.rect(rect.x, rect.y, rect.width, rect.height, 'S')
    setDash(doc)

    const badgeX = rect.x + rect.width
    const badgeY = rect.y + rect.height
    doc.setFillColor(color[0], color[1], color[2])
    doc.circle(badgeX, badgeY, 6.5, 'F')
    write(doc, `${index + 1}`, badgeX, badgeY + 2.4, { size: 7.5, color: [255, 255, 255], style: 'bold', align: 'center' })
  })
}

const drawHeader = (doc, layout) => {
  write(doc, 'Door sign measuring grid — for a holder you have not measured yet', PAGE_MARGIN, 24, {
    size: 12.5, color: INK, style: 'bold'
  })
  write(
    doc,
    `PRINT AT 100% ("Actual size", never "Fit to page") — then check a square with a ruler: every large square is exactly 1 inch / 25.4 mm. Grid is ${layout.columns}" × ${layout.rows}".`,
    PAGE_MARGIN,
    37,
    { size: 8, color: ALERT_INK, style: 'bold' }
  )
  write(
    doc,
    'All numbers count from the top-left corner of the grid — line that corner up with the corner of the holder opening.',
    PAGE_MARGIN,
    47,
    { size: 7.5, color: MUTED }
  )
}

const drawLegend = (doc, y, outlines, pageWidth, omitted = []) => {
  const heading = omitted.length > 0
    ? `Dashed outlines — known holder presets, all drawn from the grid corner (${omitted.join(', ')} ${omitted.length > 1 ? 'are' : 'is'} larger than this grid — reprint on a bigger sheet to see ${omitted.length > 1 ? 'them' : 'it'}):`
    : 'Dashed outlines — known holder presets, all drawn from the grid corner:'
  write(doc, heading, PAGE_MARGIN, y, { size: 7.5, color: MUTED })

  let x = PAGE_MARGIN
  let line = y + 12
  outlines.forEach(({ key, insertSize, index }) => {
    const color = PRESET_INKS[index % PRESET_INKS.length]
    const text = `${index + 1}  ${key} — ${formatInches(insertSize.width)}" × ${formatInches(insertSize.height)}"`
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    const width = doc.getTextWidth(text) + 26

    // Wrap onto a second row rather than running off the sheet.
    if (x + width > pageWidth - PAGE_MARGIN) {
      x = PAGE_MARGIN
      line += 11
    }

    stroke(doc, color, 1, [5, 3])
    doc.line(x, line - 2.4, x + 16, line - 2.4)
    setDash(doc)
    write(doc, text, x + 21, line, { size: 7.5, color: INK })
    x += width
  })

  return line
}

const drawFooter = (doc, layout, outlines, omitted) => {
  const { pageWidth, pageHeight } = layout
  const top = pageHeight - GRID_FOOTER_POINTS
  const textWidth = pageWidth - PAGE_MARGIN * 2

  stroke(doc, RULE_INK, 0.5)
  doc.line(PAGE_MARGIN, top, pageWidth - PAGE_MARGIN, top)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  const steps = doc.splitTextToSize(
    'How to use: 1) print at 100%  2) cut along a grid line, trying the sheet in the holder until it just slides all the way in  3) read the width off the top numbers and the height off the side numbers — that is the insert size  4) slide it in and trace the frame edge with a pencil: whatever falls inside your trace is the viewable window.',
    textWidth
  )
  write(doc, steps, PAGE_MARGIN, top + 12, { size: 7.5, color: INK })

  const legendBottom = drawLegend(doc, top + 14 + steps.length * 9.5, outlines, pageWidth, omitted)

  write(
    doc,
    'My holder —  insert (the cut sheet):  ______  ×  ______      viewable window (inside the pencil trace):  ______  ×  ______      closest preset: ______________',
    PAGE_MARGIN,
    legendBottom + 15,
    { size: 7.5, color: INK }
  )
}

// Draws the cutting grid and returns the jsPDF document. Separate from the download so the
// sheet can be rendered outside a browser.
export const buildMeasuringGridDocument = ({ paperSize, cardHolders = {} }) => {
  const layout = buildGridLayout({ paperSize })
  const outlines = buildPresetOutlines(cardHolders, layout)
  // A preset bigger than the grid can't be drawn; say so rather than quietly dropping it.
  const drawn = new Set(outlines.map(({ key }) => key))
  const omitted = Object.keys(cardHolders).filter((key) => !drawn.has(key))

  const doc = new jsPDF({ orientation: layout.orientation, unit: 'pt', format: paperSize })

  drawHeader(doc, layout)
  drawGrid(doc, layout)
  drawMillimetreTicks(doc, layout)
  drawPresetOutlines(doc, outlines)
  drawOrigin(doc, layout)
  drawFooter(doc, layout, outlines, omitted)

  return doc
}

export const exportMeasuringGridPDF = (options) => {
  try {
    buildMeasuringGridDocument(options).save('unbc-door-sign-measuring-grid.pdf')
  } catch (error) {
    console.error('Error exporting measuring grid:', error)
  }
}
