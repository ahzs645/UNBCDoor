import assert from 'node:assert/strict'
import test from 'node:test'
import { PT_PER_INCH } from './signConstants.js'
import { cardHolders } from '../data/cardHolders.js'
import { resolveHeaderGeometry, HEADER_BAND_RATIO, WORDMARK } from './headerGeometry.js'

const inPoints = (holder, departmentText) => {
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
      departmentText
    })
  }
}

const close = (actual, expected, tolerance, message) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} vs ${expected}`)

test('the lockup is drawn at its production size on a Building 10 insert', () => {
  const { geometry } = inPoints(cardHolders['Building 10'], 'Faculty of Human and Health Sciences')
  // Production artboards place the 178-unit lockup at 1pt per unit (8.23pt department line).
  close(geometry.scale, 1, 0.01, 'lockup scale')
  // Wordmark ink starts ~15.5pt below the trim top in the production files.
  close(geometry.logoY + WORDMARK.top * geometry.scale, 15.5, 1.5, 'wordmark top')
})

test('long department names stay on one line, as in the production files', () => {
  const names = [
    'Northern Analytical Laboratory Services',
    'Faculty of Human and Health Sciences',
    'School of Planning and Sustainability',
    'Faculty of Science and Engineering'
  ]
  for (const holderName of ['Building 10', 'Non-Building 10']) {
    for (const name of names) {
      const { geometry } = inPoints(cardHolders[holderName], name)
      assert.deepEqual(geometry.departmentLines, [name], `${name} on ${holderName}`)
    }
  }
})

test('a one-line department does not make the band taller', () => {
  const holder = cardHolders['Building 10']
  const bare = inPoints(holder, '')
  const withDepartment = inPoints(holder, 'Northern Analytical Laboratory Services')

  close(bare.geometry.bandHeight, bare.height * HEADER_BAND_RATIO, 0.01, 'band without department')
  close(withDepartment.geometry.bandHeight, bare.geometry.bandHeight, 0.01, 'band with department')
  assert.equal(withDepartment.geometry.logoY, bare.geometry.logoY)
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
