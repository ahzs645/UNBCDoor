import assert from 'node:assert/strict'
import test from 'node:test'
import { PT_PER_INCH } from './signConstants.js'
import { cardHolders } from '../data/cardHolders.js'
import { resolveHeaderGeometry, HEADER_BAND_RATIO, WORDMARK } from './headerGeometry.js'

const inPoints = (holder, departmentText, departmentWrap) => {
  const width = holder.insertSize.width * PT_PER_INCH
  const height = holder.insertSize.height * PT_PER_INCH
  const view = holder.viewableOffset
  const viewable = {
    top: view.top * PT_PER_INCH,
    right: view.right * PT_PER_INCH,
    bottom: view.bottom * PT_PER_INCH,
    left: view.left * PT_PER_INCH
  }
  const viewableWidth = width - viewable.left - viewable.right
  const padX = viewableWidth * 0.12
  return {
    width,
    height,
    geometry: resolveHeaderGeometry({
      width,
      height,
      viewable,
      textX: viewable.left + padX,
      rightInset: padX,
      departmentText,
      departmentWrap
    })
  }
}

const close = (actual, expected, tolerance, message) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} vs ${expected}`)

// The same insert with no holder: the window is the whole trimmed card.
const bareInsert = (holder) => ({
  ...holder,
  viewableOffset: { top: 0, right: 0, bottom: 0, left: 0 }
})

const wordmarkBottom = (geometry) => geometry.logoY + (WORDMARK.top + WORDMARK.height) * geometry.scale

test('the lockup is drawn at its production size on a Building 10 insert', () => {
  const { geometry } = inPoints(bareInsert(cardHolders['Building 10']), '')
  // Production artboards place the 178-unit lockup at 1pt per unit (8.23pt department line).
  close(geometry.scale, 1, 0.01, 'lockup scale')
  // Wordmark ink starts ~15.5pt below the trim top in the production files.
  close(geometry.logoY + WORDMARK.top * geometry.scale, 15.5, 1.5, 'wordmark top')
})

test('without a holder, a bare wordmark gets the production 20.5% band', () => {
  const { height, geometry } = inPoints(bareInsert(cardHolders['Building 10']), '')
  close(geometry.bandHeight, height * HEADER_BAND_RATIO, 0.01, 'band height')
})

test('the green above the wordmark matches the green below it, measured from the window', () => {
  for (const [holderName, holder] of Object.entries(cardHolders)) {
    const { geometry } = inPoints(holder, '')
    const frameTop = holder.viewableOffset.top * PT_PER_INCH
    const above = geometry.wordmarkTop - frameTop
    const below = geometry.bandHeight - wordmarkBottom(geometry)
    assert.ok(above > 0, `${holderName}: the frame leaves room above the wordmark`)
    close(above, below, 0.001, `${holderName}: margins`)
  }
})

test('the visible band is 20.5% of the window', () => {
  const holder = cardHolders['Building 10']
  const { height, geometry } = inPoints(holder, '')
  const top = holder.viewableOffset.top * PT_PER_INCH
  const windowHeight = height - top - holder.viewableOffset.bottom * PT_PER_INCH
  close(geometry.bandHeight - top, windowHeight * HEADER_BAND_RATIO, 0.01, 'visible band')
})

test('department names wrap by the UNBC logo kit rule by default', () => {
  for (const holderName of ['Building 10', 'Non-Building 10']) {
    const { geometry } = inPoints(cardHolders[holderName], 'Northern Analytical Laboratory Services')
    assert.deepEqual(geometry.departmentLines, ['Northern Analytical', 'Laboratory Services'], holderName)
  }
})

test('the full-width option keeps long names on one line, as in older production files', () => {
  const names = [
    'Northern Analytical Laboratory Services',
    'Faculty of Human and Health Sciences',
    'School of Planning and Sustainability',
    'Faculty of Science and Engineering'
  ]
  for (const holderName of ['Building 10', 'Non-Building 10']) {
    for (const name of names) {
      const { geometry } = inPoints(cardHolders[holderName], name, 'band')
      assert.deepEqual(geometry.departmentLines, [name], `${name} on ${holderName}`)
    }
  }
})

test('a department line keeps the same margin under it', () => {
  const holder = cardHolders['Building 10']
  const bare = inPoints(holder, '')
  const withDepartment = inPoints(holder, 'School of Engineering')
  const { geometry } = withDepartment

  assert.equal(geometry.logoY, bare.geometry.logoY, 'wordmark stays where it was')
  assert.ok(geometry.bandHeight > bare.geometry.bandHeight, 'the band makes room for the line')
  close(geometry.bandHeight - geometry.lockupBottom, geometry.margin, 0.001, 'margin under the line')
})

test('a wrapped department grows the band downward', () => {
  const holder = cardHolders['Building 10']
  const one = inPoints(holder, 'School of Engineering')
  const two = inPoints(holder, 'Northern Analytical Laboratory Services')

  assert.ok(two.geometry.bandHeight > one.geometry.bandHeight, 'band grows for the second line')
  assert.equal(two.geometry.logoY, one.geometry.logoY, 'wordmark stays where it was')
})

test('an explicit second department line grows the band downward', () => {
  const holder = cardHolders['Non-Building 10']
  const one = inPoints(holder, 'Faculty of Environment')
  const two = inPoints(holder, 'Faculty of Environment\nGeography Program')

  assert.equal(two.geometry.departmentLines.length, 2)
  assert.ok(two.geometry.bandHeight > one.geometry.bandHeight, 'band grows for a second line')
  assert.equal(two.geometry.logoY, one.geometry.logoY, 'wordmark stays where it was')
})

test('a deep holder frame never covers the wordmark', () => {
  const holder = cardHolders['Legacy Letter-Half']
  const { geometry } = inPoints(holder, 'School of Engineering')
  const frameTop = holder.viewableOffset.top * PT_PER_INCH

  assert.ok(geometry.logoY + WORDMARK.top * geometry.scale >= frameTop - 0.001, 'wordmark below frame')
  assert.ok(geometry.bandHeight > frameTop, 'band extends below the frame')
})
