// Header band + UNBC lockup geometry, measured from the production Illustrator artboards in the
// print archive. Every production file draws the lockup the same way:
//
//   * The lockup is placed at its native size (1pt per lockup unit), which is ~35.5% of the
//     trimmed card width on the ~7" inserts. The department line is therefore 8.23pt.
//   * The green band is ~20.5% of the trimmed card height, and the wordmark is centred in it.
//   * A department line hangs under the wordmark on ONE line, running past "NORTHERN BRITISH
//     COLUMBIA" when it is long ("Northern Analytical Laboratory Services" is ~171pt). The band
//     does not grow for it — only an explicit second line (or one wider than the whole band)
//     pushes the band down.
//   * The wordmark's slanted "U" sits ~2.5% of the width left of the body text column.
//
// Everything here is plain arithmetic in points so it runs under `node --test` as well as in the
// artwork renderer, and the preview, PNG and PDF exports all share it.

import { DEPARTMENT_LINE, LOGO_VIEWBOX, splitDepartmentText } from '../../vendor/unbc-logo/src/logo/logoText.js'

export const HEADER_BAND_RATIO = 0.205
export const LOGO_WIDTH_RATIO = 0.355
export const LOGO_TEXT_OFFSET_RATIO = 0.025

// Wordmark ink inside the lockup's 178×80 viewBox (the rest of the box is room for the
// department line).
export const WORDMARK = { top: 15, height: 30.68 }

// Space between the last department baseline and the bottom of the band, in lockup units.
// Production files leave ~9.5pt (9.4–9.7) under an 8.23pt department line.
const DEPARTMENT_BOTTOM_SPACE = 9.4

/**
 * @param {object} options
 * @param {number} options.width      trimmed card width (pt)
 * @param {number} options.height     trimmed card height (pt)
 * @param {object} options.viewable   frame coverage in pt: { top, right, bottom, left }
 * @param {number} options.textX      body text column, measured from the trim's left edge (pt)
 * @param {number} options.rightInset right-hand content padding inside the viewable window (pt)
 * @param {string} options.departmentText
 * @returns trim-space geometry: band height, lockup origin/scale, wrapped department lines, and
 *          the wrap width (lockup units) the lockup should be rendered with.
 */
export const resolveHeaderGeometry = ({
  width,
  height,
  viewable = {},
  textX,
  rightInset = 0,
  departmentText = ''
}) => {
  const top = Math.max(viewable.top || 0, 0)
  const left = Math.max(viewable.left || 0, 0)
  const right = Math.max(viewable.right || 0, 0)

  const scale = (width * LOGO_WIDTH_RATIO) / LOGO_VIEWBOX.width
  const logoX = Math.max(textX - width * LOGO_TEXT_OFFSET_RATIO, left)

  const baseBand = height * HEADER_BAND_RATIO
  // Centre the wordmark in the band, but never let the holder frame cover its top edge.
  const centredY = baseBand / 2 - (WORDMARK.top + WORDMARK.height / 2) * scale
  const wordmarkEnd = WORDMARK.top + WORDMARK.height
  const logoY = Math.max(centredY, top - WORDMARK.top * scale)

  // The department line may run to the right edge of the live area — the band is the limit,
  // not the width of the wordmark above it.
  const departmentX = logoX + DEPARTMENT_LINE.x * scale
  const rightEdge = width - right - rightInset
  const departmentMaxWidth = Math.max((rightEdge - departmentX) / scale, DEPARTMENT_LINE.maxWidth)
  const departmentLines = splitDepartmentText(departmentText || '', departmentMaxWidth)

  // What the band must reach below the lockup: the same margin a centred wordmark gets, or the
  // production spacing under the last department line, whichever is lower on the card.
  const wordmarkMargin = baseBand - (centredY + wordmarkEnd * scale)
  const lastDepartmentBaseline = DEPARTMENT_LINE.y + (departmentLines.length - 1) * DEPARTMENT_LINE.lineHeight
  const contentBottom = departmentLines.length
    ? logoY + (lastDepartmentBaseline + DEPARTMENT_BOTTOM_SPACE) * scale
    : logoY + wordmarkEnd * scale + wordmarkMargin

  return {
    bandHeight: Math.max(baseBand, contentBottom),
    logoX,
    logoY,
    scale,
    departmentLines,
    departmentMaxWidth
  }
}
