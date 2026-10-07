import assert from 'node:assert/strict'
import test from 'node:test'
import { paginatePrintRun, resolvePrintSheet } from './printSheet.js'
import { PT_PER_INCH } from './signConstants.js'

const BUILDING_10 = { width: 6.97, height: 4.17 }

test('one card per sheet is centred on a sheet turned to match it', () => {
  const sheet = resolvePrintSheet({ insertSize: BUILDING_10, paperSize: 'letter' })
  assert.equal(sheet.orientation, 'landscape')
  assert.equal(sheet.perSheet, 1)
  const [slot] = sheet.slots
  assert.equal(slot.x * 2 + sheet.card.width, sheet.pageWidth)
  assert.equal(slot.y * 2 + sheet.card.height, sheet.pageHeight)
  // Crop marks: two arms on each of the four cuts.
  assert.equal(sheet.cropMarks.length, 8)
  assert.equal(sheet.cutLines.length, 0)
})

test('filling a sheet keeps whichever way round fits more cards', () => {
  const letter = resolvePrintSheet({ insertSize: BUILDING_10, paperSize: 'letter', layout: 'fill' })
  assert.equal(letter.orientation, 'portrait')
  assert.deepEqual([letter.cols, letter.rows], [1, 2])

  const tabloid = resolvePrintSheet({ insertSize: BUILDING_10, paperSize: 'tabloid', layout: 'fill' })
  assert.equal(tabloid.orientation, 'landscape')
  assert.deepEqual([tabloid.cols, tabloid.rows], [2, 2])
})

test('every card and its guides stay on the sheet', () => {
  for (const paperSize of ['letter', 'a4', 'legal', 'tabloid']) {
    for (const spacing of ['gap', 'butted']) {
      const sheet = resolvePrintSheet({ insertSize: BUILDING_10, paperSize, layout: 'fill', spacing, cutGuides: 'both' })
      for (const [x1, y1, x2, y2] of [...sheet.cropMarks, ...sheet.cutLines]) {
        for (const [x, y] of [[x1, y1], [x2, y2]]) {
          assert.ok(x >= -0.001 && x <= sheet.pageWidth + 0.001, `${paperSize} ${spacing} x ${x}`)
          assert.ok(y >= -0.001 && y <= sheet.pageHeight + 0.001, `${paperSize} ${spacing} y ${y}`)
        }
      }
    }
  }
})

test('gapped cards keep their own bleed; butted cards share one cut', () => {
  const insertSize = { width: 3.5, height: 2 }
  const gap = resolvePrintSheet({ insertSize, paperSize: 'letter', layout: 'fill', spacing: 'gap' })
  const butted = resolvePrintSheet({ insertSize, paperSize: 'letter', layout: 'fill', spacing: 'butted' })
  const bleed = 0.125 * PT_PER_INCH

  // Two cuts per column with a gap, one shared cut between butted neighbours.
  assert.equal(gap.cutsX.length, gap.cols * 2)
  assert.equal(butted.cutsX.length, butted.cols + 1)
  assert.ok(butted.perSheet >= gap.perSheet)

  // Gapped bleed areas meet but never overlap; butted cards stop at the shared cut.
  const [first, second] = gap.slots
  assert.equal(first.clip.x + first.clip.width, second.clip.x)
  assert.equal(first.clip.width, gap.card.width + bleed * 2)
  const [a, b] = butted.slots
  assert.equal(a.clip.x + a.clip.width, b.x)
  assert.equal(a.clip.width, butted.card.width + bleed)
})

test('cut lines run the full length of the block on every cut', () => {
  const sheet = resolvePrintSheet({ insertSize: BUILDING_10, paperSize: 'tabloid', layout: 'fill', cutGuides: 'lines' })
  assert.equal(sheet.cropMarks.length, 0)
  assert.equal(sheet.cutLines.length, sheet.cutsX.length + sheet.cutsY.length)
  const vertical = sheet.cutLines[0]
  assert.ok(vertical[1] < sheet.bleedBox.top && vertical[3] > sheet.bleedBox.bottom)
})

test('an insert too big for the sheet still prints one card, flagged as not fitting', () => {
  const sheet = resolvePrintSheet({ insertSize: { width: 8.5, height: 5.5 }, paperSize: 'letter', layout: 'fill' })
  assert.equal(sheet.perSheet, 1)
  assert.equal(sheet.fits, true)
  const huge = resolvePrintSheet({ insertSize: { width: 12, height: 9 }, paperSize: 'letter', layout: 'fill' })
  assert.equal(huge.fits, false)
  assert.equal(huge.perSheet, 1)
})

test('a print run groups cards by size and shares sheets between sizes', () => {
  const small = { width: 6.85, height: 3.94 }
  const items = [
    { id: 1, insertSize: BUILDING_10 },
    { id: 2, insertSize: small },
    { id: 3, insertSize: BUILDING_10 },
    { id: 4, insertSize: BUILDING_10 }
  ]
  const pages = paginatePrintRun(items, { paperSize: 'letter', layout: 'fill' })
  assert.deepEqual(pages.map(page => page.items.map(item => item?.id ?? null)), [[1, 3], [4, 2]])
  assert.deepEqual(pages[1].sheet.cardSizes, [BUILDING_10, small])
  assert.equal(pages[1].sheet.slots[1].height, small.height * PT_PER_INCH)
})

test('one card per sheet prints every card on its own sheet', () => {
  const items = [{ id: 1, insertSize: BUILDING_10 }, { id: 2, insertSize: { width: 6.85, height: 3.94 } }]
  const pages = paginatePrintRun(items, { paperSize: 'letter', layout: 'single' })
  assert.deepEqual(pages.map(page => page.items.map(item => item.id)), [[1], [2]])
})

test('a sheet of one size is the same sheet the fill layout draws', () => {
  const items = [{ id: 1, insertSize: BUILDING_10 }]
  const [page] = paginatePrintRun(items, { paperSize: 'tabloid', layout: 'fill', spacing: 'butted', cutGuides: 'both' })
  const sheet = resolvePrintSheet({ insertSize: BUILDING_10, paperSize: 'tabloid', layout: 'fill', spacing: 'butted', cutGuides: 'both' })
  assert.deepEqual(page.sheet.slots, sheet.slots)
  assert.deepEqual(page.sheet.cropMarks, sheet.cropMarks)
  assert.equal(page.items.length, sheet.perSheet)
  assert.deepEqual(page.items.slice(1), Array(sheet.perSheet - 1).fill(null))
})

test('two holders of different sizes share one sheet, each band with its own guides', () => {
  // The 6-352 and Building 6 holders.
  const room6352 = { width: 7.008, height: 4.469 }
  const building6 = { width: 7.677, height: 3.976 }
  for (const cutGuides of ['marks', 'lines', 'both', 'none']) {
    for (const spacing of ['gap', 'butted']) {
      const items = [{ id: 1, insertSize: room6352 }, { id: 2, insertSize: building6 }]
      const pages = paginatePrintRun(items, { paperSize: 'letter', layout: 'fill', spacing, cutGuides })
      assert.equal(pages.length, 1, `${spacing} ${cutGuides}`)
      const { sheet, items: placed } = pages[0]
      assert.deepEqual(placed.map(item => item.id), [1, 2])

      // Every card's painted region stays clear of every other card's, and of the guides.
      const [a, b] = sheet.slots
      assert.ok(a.clip.y + a.clip.height <= b.clip.y)
      for (const [x1, y1, x2, y2] of [...sheet.cropMarks, ...sheet.cutLines]) {
        for (const [x, y] of [[x1, y1], [x2, y2]]) {
          assert.ok(x >= -0.001 && x <= sheet.pageWidth + 0.001)
          assert.ok(y >= -0.001 && y <= sheet.pageHeight + 0.001)
        }
      }
      for (const [x1, y1, x2, y2] of sheet.cropMarks) {
        for (const slot of sheet.slots) {
          const { clip } = slot
          const inside = Math.max(x1, x2) > clip.x + 0.001 && Math.min(x1, x2) < clip.x + clip.width - 0.001
            && Math.max(y1, y2) > clip.y + 0.001 && Math.min(y1, y2) < clip.y + clip.height - 0.001
          assert.ok(!inside, `crop mark over a card (${spacing} ${cutGuides})`)
        }
      }
    }
  }
})

test('a card too big for the sheet prints alone and the rest still pack together', () => {
  const huge = { width: 12, height: 9 }
  const items = [{ id: 1, insertSize: huge }, { id: 2, insertSize: BUILDING_10 }, { id: 3, insertSize: BUILDING_10 }]
  const pages = paginatePrintRun(items, { paperSize: 'letter', layout: 'fill' })
  assert.deepEqual(pages.map(page => page.items.map(item => item?.id ?? null)), [[2, 3], [1]])
  assert.equal(pages[1].sheet.fits, false)
})
