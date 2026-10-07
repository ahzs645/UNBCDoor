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

const guideSettings = (spacing, cutGuides) => {
  const butted = spacing === 'butted'
  return {
    butted,
    gutterInches: butted ? 0 : BLEED_INCHES * 2,
    marks: cutGuides === 'marks' || cutGuides === 'both',
    lines: cutGuides === 'lines' || cutGuides === 'both',
    // Cut lines run out past the block as far as crop marks would, so either needs that margin.
    armInches: cutGuides === 'none' ? 0 : MARK_INCHES
  }
}

// Vertical room a band of `rows` cards of `height` takes, its bleed and guide arms included.
const bandHeight = (height, rows, gutter, outside) => rows * height + (rows - 1) * gutter + 2 * outside

// Lays out one sheet: `bands` stacked top to bottom, each a grid of one card size
// ({ insertSize, cols, rows }), the stack centred on the page. Each band carries its own bleed,
// crop marks and cut lines, so its cuts run straight across it; bands sit far enough apart that
// one band's guides never run into the next.
const layoutSheet = ({ paperSize, orientation, bands, spacing, cutGuides }) => {
  const paper = PAPER_DIMENSIONS[paperSize] || PAPER_DIMENSIONS.letter
  const page = orientedPaper(paper, orientation)
  const { butted, gutterInches, marks, lines, armInches } = guideSettings(spacing, cutGuides)

  const pageWidth = page.width * PT_PER_INCH
  const pageHeight = page.height * PT_PER_INCH
  const B = BLEED_INCHES * PT_PER_INCH
  const gutter = gutterInches * PT_PER_INCH
  const arm = armInches * PT_PER_INCH
  const outside = B + arm

  const stackHeight = bands.reduce((sum, band) => sum + bandHeight(band.insertSize.height * PT_PER_INCH, band.rows, gutter, outside), 0)
  let bandTop = (pageHeight - stackHeight) / 2

  const slots = []
  const cropMarks = []
  const cutLines = []
  const allCutsX = []
  const allCutsY = []
  const boxes = []
  bands.forEach(({ insertSize, cols, rows }) => {
    const W = insertSize.width * PT_PER_INCH
    const H = insertSize.height * PT_PER_INCH
    const blockWidth = cols * W + (cols - 1) * gutter
    const blockHeight = rows * H + (rows - 1) * gutter
    const x0 = (pageWidth - blockWidth) / 2
    const y0 = bandTop + outside
    bandTop += bandHeight(H, rows, gutter, outside)

    const bandSlots = []
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x = x0 + col * (W + gutter)
        const y = y0 + row * (H + gutter)
        // Butted cards stop at the shared cut; everywhere else a card keeps its bleed.
        const left = butted && col > 0 ? x : x - B
        const top = butted && row > 0 ? y : y - B
        const right = butted && col < cols - 1 ? x + W : x + W + B
        const bottom = butted && row < rows - 1 ? y + H : y + H + B
        bandSlots.push({ row, col, x, y, width: W, height: H, clip: { x: left, y: top, width: right - left, height: bottom - top } })
      }
    }
    slots.push(...bandSlots)

    const cutsX = uniqueSorted(bandSlots.flatMap(slot => [slot.x, slot.x + W]))
    const cutsY = uniqueSorted(bandSlots.flatMap(slot => [slot.y, slot.y + H]))
    allCutsX.push(...cutsX)
    allCutsY.push(...cutsY)
    const box = { left: x0 - B, top: y0 - B, right: x0 + blockWidth + B, bottom: y0 + blockHeight + B }
    boxes.push(box)

    if (marks) {
      cropMarks.push(
        ...cutsX.flatMap(x => [
          [x, box.top - arm, x, box.top],
          [x, box.bottom, x, box.bottom + arm]
        ]),
        ...cutsY.flatMap(y => [
          [box.left - arm, y, box.left, y],
          [box.right, y, box.right + arm, y]
        ])
      )
    }
    // Drawn over the artwork, so each one sits exactly on a cut and is trimmed away with it.
    if (lines) {
      cutLines.push(
        ...cutsX.map(x => [x, box.top - arm, x, box.bottom + arm]),
        ...cutsY.map(y => [box.left - arm, y, box.right + arm, y])
      )
    }
  })

  const bleedBox = {
    left: Math.min(...boxes.map(box => box.left)),
    top: Math.min(...boxes.map(box => box.top)),
    right: Math.max(...boxes.map(box => box.right)),
    bottom: Math.max(...boxes.map(box => box.bottom))
  }
  const guidesBottom = bleedBox.bottom + arm
  const footerBaseline = pageHeight - PRINTER_MARGIN_INCHES * PT_PER_INCH
  const footer = footerBaseline - FOOTER_INCHES * PT_PER_INCH >= guidesBottom
    ? { baseline: footerBaseline, left: Math.max(bleedBox.left - arm, PRINTER_MARGIN_INCHES * PT_PER_INCH) }
    : null

  const [first] = bands
  return {
    orientation,
    paperSize: PAPER_DIMENSIONS[paperSize] ? paperSize : 'letter',
    pageWidth,
    pageHeight,
    bleed: B,
    // The first band's card and grid; a sheet of one size has only that band.
    card: { width: first.insertSize.width * PT_PER_INCH, height: first.insertSize.height * PT_PER_INCH, bleed: B },
    cols: first.cols,
    rows: first.rows,
    // Every card size on the sheet (inches), in band order.
    cardSizes: bands.map(band => band.insertSize),
    perSheet: slots.length,
    slots,
    cutsX: uniqueSorted(allCutsX),
    cutsY: uniqueSorted(allCutsY),
    bleedBox,
    cropMarks,
    cutLines,
    footer
  }
}

/**
 * @param {object} options
 * @param {{width:number,height:number}} options.insertSize trimmed card (inches)
 * @param {string} [options.paperSize] key of PAPER_DIMENSIONS
 * @param {'single'|'fill'} [options.layout]
 * @param {'gap'|'butted'} [options.spacing]
 * @param {'marks'|'lines'|'both'|'none'} [options.cutGuides]
 * @returns the page (pt, oriented), the card slots (trim top-left and size, and the region of the
 *          sheet each card may paint — its trim plus the bleed it keeps), the cut positions, the
 *          crop mark and cut line segments, and where the footer goes (null when there's no room).
 */
export const resolvePrintSheet = ({
  insertSize,
  paperSize = 'letter',
  layout = 'single',
  spacing = 'gap',
  cutGuides = 'marks'
}) => {
  const paper = PAPER_DIMENSIONS[paperSize] || PAPER_DIMENSIONS.letter
  const { gutterInches, armInches } = guideSettings(spacing, cutGuides)
  const outside = BLEED_INCHES + armInches
  const matching = insertSize.width >= insertSize.height ? 'landscape' : 'portrait'

  const options = (layout === 'fill' ? ['portrait', 'landscape'] : [matching]).map((orientation) => {
    const page = orientedPaper(paper, orientation)
    const cols = fitAlong(page.width, insertSize.width, gutterInches, outside)
    const rows = fitAlong(page.height, insertSize.height, gutterInches, outside)
    return { orientation, cols, rows }
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

  return {
    ...layoutSheet({ paperSize, orientation: best.orientation, bands: [{ insertSize, cols, rows }], spacing, cutGuides }),
    fits,
    // The most that would fit with these options, whatever the layout — for "Fill sheet (n)".
    capacity: best.cols * best.rows
  }
}

// Packs as many of `groups` (each { insertSize, items }, items still to place) onto one sheet
// turned `orientation` as fit: a band of rows per size, sizes in order, each size taking as many
// rows as it needs and the sheet has room for, any size that doesn't fit leaving the room to the
// sizes after it. When a row of the last band's size still fits, the band grows by empty rows, so
// the sheet shows what else it could take. Returns the bands and how many items each took.
const packSheet = (groups, { paperSize, orientation, spacing, cutGuides }) => {
  const paper = PAPER_DIMENSIONS[paperSize] || PAPER_DIMENSIONS.letter
  const page = orientedPaper(paper, orientation)
  const { gutterInches, armInches } = guideSettings(spacing, cutGuides)
  const outside = BLEED_INCHES + armInches

  let room = page.height
  const bands = []
  groups.forEach((group, index) => {
    if (!group.items.length) return
    const { width, height } = group.insertSize
    const cols = fitAlong(page.width, width, gutterInches, outside)
    const rowsThatFit = fitAlong(room, height, gutterInches, outside)
    if (!cols || !rowsThatFit) return
    const rows = Math.min(rowsThatFit, Math.ceil(group.items.length / cols))
    bands.push({ group: index, insertSize: group.insertSize, cols, rows, count: Math.min(group.items.length, cols * rows) })
    room -= bandHeight(height, rows, gutterInches, outside)
  })

  const last = bands[bands.length - 1]
  if (last) {
    const extra = fitAlong(room + bandHeight(last.insertSize.height, last.rows, gutterInches, outside), last.insertSize.height, gutterInches, outside) - last.rows
    if (extra > 0) last.rows += extra
  }
  return bands
}

// Lays a print run out on as many sheets as it takes. `items` carry an `insertSize`; each page
// lists the items on it in slot order. One card per sheet ('single') prints each item on its own
// sheet. Filled sheets put cards of one size in a shared grid, and cards of other sizes in bands
// of their own above or below it, so a run of mixed holders shares sheets rather than starting a
// new one at every size. Sizes print in the order they first appear; each sheet is turned
// whichever way takes more of what's left (then whichever leaves more room, then whichever
// matches the first card).
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

  if (options.layout !== 'fill') {
    return groups.flatMap(group => group.items.map(item => ({
      sheet: resolvePrintSheet({ ...options, insertSize: group.insertSize }),
      items: [item]
    })))
  }

  const pages = []
  while (groups.some(group => group.items.length)) {
    const next = groups.find(group => group.items.length)
    const matching = next.insertSize.width >= next.insertSize.height ? 'landscape' : 'portrait'
    const best = ['portrait', 'landscape']
      .map(orientation => ({ orientation, bands: packSheet(groups, { ...options, orientation }) }))
      .map(option => ({
        ...option,
        count: option.bands.reduce((sum, band) => sum + band.count, 0),
        slots: option.bands.reduce((sum, band) => sum + band.cols * band.rows, 0)
      }))
      .reduce((winner, option) => {
        if (option.count !== winner.count) return option.count > winner.count ? option : winner
        if (option.slots !== winner.slots) return option.slots > winner.slots ? option : winner
        return option.orientation === matching ? option : winner
      })

    if (!best.count) {
      // Too big for the sheet either way round: it prints alone, centred, flagged by the fit warning.
      pages.push({ sheet: resolvePrintSheet({ ...options, insertSize: next.insertSize }), items: [next.items.shift()] })
      continue
    }

    const sheet = layoutSheet({ ...options, orientation: best.orientation, bands: best.bands })
    const pageItems = best.bands.flatMap(band => groups[band.group].items.splice(0, band.count))
    // Slots run band by band; a band's unfilled slots sit between its cards and the next band's.
    const slotItems = []
    best.bands.forEach((band) => {
      const placed = pageItems.splice(0, band.count)
      slotItems.push(...placed, ...Array(band.cols * band.rows - placed.length).fill(null))
    })
    pages.push({ sheet, items: slotItems })
  }
  return pages
}
