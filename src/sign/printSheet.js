import { BLEED_INCHES, MARK_INCHES, PAPER_DIMENSIONS, PT_PER_INCH } from './signConstants.js'

// Lays printed cards out on a sheet: one card, or as many as fit, with the cut guides that go
// with them. Pure arithmetic in points (origin top-left), so the on-screen sheet preview and the
// PDF exporter draw exactly the same sheet, and it runs under `node --test`.
//
//   * Every card keeps its 1/8" bleed on the outside of the block. Between cards there is either
//     a gap of two bleeds (each card keeps its own bleed: two cuts between neighbours, and a
//     slightly-off cut still lands on the card's own colour), or no gap at all (butted: one cut
//     between neighbours, fewer cuts, but a slip shows a sliver of the next card).
//   * Cut guides are crop marks (short arms in the margin, in line with every cut), cut lines
//     (hairlines along every cut, running through the gaps and out past the block), both, or
//     none. Cards in a grid share their rows and columns, so the cuts are full-length straight
//     lines across the block — one pass of a guillotine or a ruler each.
//   * "Fill" tries the sheet both ways round and keeps whichever fits more cards (ties go to the
//     orientation that matches the card).

export const SHEET_LAYOUTS = ['single', 'fill']
export const SHEET_SPACINGS = ['gap', 'butted']
export const CUT_GUIDES = ['marks', 'lines', 'both', 'none']

export const DEFAULT_SHEET_OPTIONS = {
  layout: 'single',
  spacing: 'gap',
  cutGuides: 'marks',
  fillWith: 'copies',
  showLabel: true,
  showScale: true
}

// The strip along the sheet's bottom edge most printers can't reach; the footer stays above it.
const PRINTER_MARGIN_INCHES = 0.25
// Room the footer (label and 1" scale bar) needs between the guides and that margin.
const FOOTER_INCHES = 0.3

const orientedPaper = (paper, orientation) => (orientation === 'landscape'
  ? { width: paper.height, height: paper.width }
  : { width: paper.width, height: paper.height })

// How many cards of `card` length fit along `page`, each gap `gutter` apart, with a bleed and a
// guide arm on both outside edges.
const fitAlong = (page, card, gutter, outside) => Math.max(
  0,
  Math.floor((page - 2 * outside + gutter) / (card + gutter) + 1e-9)
)

const uniqueSorted = values => [...new Set(values.map(value => Math.round(value * 1000) / 1000))].sort((a, b) => a - b)

/**
 * @param {object} options
 * @param {{width:number,height:number}} options.insertSize trimmed card (inches)
 * @param {string} [options.paperSize] key of PAPER_DIMENSIONS
 * @param {'single'|'fill'} [options.layout]
 * @param {'gap'|'butted'} [options.spacing]
 * @param {'marks'|'lines'|'both'|'none'} [options.cutGuides]
 * @returns the page (pt, oriented), the card slots (trim top-left, and the region of the sheet
 *          each card may paint — its trim plus the bleed it keeps), the cut positions, the crop
 *          mark and cut line segments, and where the footer goes (null when there's no room).
 */
export const resolvePrintSheet = ({
  insertSize,
  paperSize = 'letter',
  layout = 'single',
  spacing = 'gap',
  cutGuides = 'marks'
}) => {
  const paper = PAPER_DIMENSIONS[paperSize] || PAPER_DIMENSIONS.letter
  const butted = spacing === 'butted'
  const gutterInches = butted ? 0 : BLEED_INCHES * 2
  const marks = cutGuides === 'marks' || cutGuides === 'both'
  const lines = cutGuides === 'lines' || cutGuides === 'both'
  // Cut lines run out past the block as far as crop marks would, so either needs that margin.
  const armInches = cutGuides === 'none' ? 0 : MARK_INCHES
  const outside = BLEED_INCHES + armInches
  const matching = insertSize.width >= insertSize.height ? 'landscape' : 'portrait'

  const options = (layout === 'fill' ? ['portrait', 'landscape'] : [matching]).map((orientation) => {
    const page = orientedPaper(paper, orientation)
    const cols = fitAlong(page.width, insertSize.width, gutterInches, outside)
    const rows = fitAlong(page.height, insertSize.height, gutterInches, outside)
    return { orientation, page, cols, rows }
  })
  const best = options.reduce((winner, option) => {
    const count = option.cols * option.rows
    const winnerCount = winner.cols * winner.rows
    if (count > winnerCount) return option
    if (count === winnerCount && option.orientation === matching) return option
    return winner
  })

  // One card always prints, centred, even when it overruns the sheet (the fit warning says so).
  const fits = best.cols * best.rows > 0
  const cols = layout === 'fill' && fits ? best.cols : 1
  const rows = layout === 'fill' && fits ? best.rows : 1

  const pageWidth = best.page.width * PT_PER_INCH
  const pageHeight = best.page.height * PT_PER_INCH
  const W = insertSize.width * PT_PER_INCH
  const H = insertSize.height * PT_PER_INCH
  const B = BLEED_INCHES * PT_PER_INCH
  const gutter = gutterInches * PT_PER_INCH
  const arm = armInches * PT_PER_INCH

  const blockWidth = cols * W + (cols - 1) * gutter
  const blockHeight = rows * H + (rows - 1) * gutter
  const x0 = (pageWidth - blockWidth) / 2
  const y0 = (pageHeight - blockHeight) / 2

  const slots = []
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = x0 + col * (W + gutter)
      const y = y0 + row * (H + gutter)
      // Butted cards stop at the shared cut; everywhere else a card keeps its bleed.
      const left = butted && col > 0 ? x : x - B
      const top = butted && row > 0 ? y : y - B
      const right = butted && col < cols - 1 ? x + W : x + W + B
      const bottom = butted && row < rows - 1 ? y + H : y + H + B
      slots.push({ row, col, x, y, clip: { x: left, y: top, width: right - left, height: bottom - top } })
    }
  }

  const cutsX = uniqueSorted(slots.flatMap(slot => [slot.x, slot.x + W]))
  const cutsY = uniqueSorted(slots.flatMap(slot => [slot.y, slot.y + H]))
  const bleedBox = { left: x0 - B, top: y0 - B, right: x0 + blockWidth + B, bottom: y0 + blockHeight + B }

  const cropMarks = marks ? [
    ...cutsX.flatMap(x => [
      [x, bleedBox.top - arm, x, bleedBox.top],
      [x, bleedBox.bottom, x, bleedBox.bottom + arm]
    ]),
    ...cutsY.flatMap(y => [
      [bleedBox.left - arm, y, bleedBox.left, y],
      [bleedBox.right, y, bleedBox.right + arm, y]
    ])
  ] : []

  // Drawn over the artwork, so each one sits exactly on a cut and is trimmed away with it.
  const cutLines = lines ? [
    ...cutsX.map(x => [x, bleedBox.top - arm, x, bleedBox.bottom + arm]),
    ...cutsY.map(y => [bleedBox.left - arm, y, bleedBox.right + arm, y])
  ] : []

  const guidesBottom = bleedBox.bottom + arm
  const footerBaseline = pageHeight - PRINTER_MARGIN_INCHES * PT_PER_INCH
  const footer = footerBaseline - FOOTER_INCHES * PT_PER_INCH >= guidesBottom
    ? { baseline: footerBaseline, left: Math.max(bleedBox.left - arm, PRINTER_MARGIN_INCHES * PT_PER_INCH) }
    : null

  return {
    orientation: best.orientation,
    paperSize: PAPER_DIMENSIONS[paperSize] ? paperSize : 'letter',
    pageWidth,
    pageHeight,
    card: { width: W, height: H, bleed: B },
    cols,
    rows,
    perSheet: cols * rows,
    fits,
    // The most that would fit with these options, whatever the layout — for "Fill sheet (n)".
    capacity: best.cols * best.rows,
    slots,
    cutsX,
    cutsY,
    bleedBox,
    cropMarks,
    cutLines,
    footer
  }
}

// Cards of different sizes can't share a grid, so a print run is split by size: each size is
// laid out on its own sheets, in the order the sizes first appear. `items` carry an
// `insertSize`; each page lists the items on it in slot order.
export const paginatePrintRun = (items, options) => {
  const groups = []
  items.forEach((item) => {
    const key = `${item.insertSize.width}×${item.insertSize.height}`
    let group = groups.find(entry => entry.key === key)
    if (!group) {
      group = { key, insertSize: item.insertSize, items: [] }
      groups.push(group)
    }
    group.items.push(item)
  })

  return groups.flatMap((group) => {
    const sheet = resolvePrintSheet({ ...options, insertSize: group.insertSize })
    const pages = []
    for (let start = 0; start < group.items.length; start += sheet.perSheet) {
      pages.push({ sheet, items: group.items.slice(start, start + sheet.perSheet) })
    }
    return pages
  })
}
