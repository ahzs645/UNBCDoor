// Header band + UNBC lockup geometry, measured from the production Illustrator artboards in the
// print archive and then fitted to the holder window the sign is actually seen through:
//
//   * The lockup is placed at its native size (1pt per lockup unit), which is ~35.5% of the
//     trimmed card width on the ~7" inserts. The department line is therefore 8.23pt.
//   * The visible green band is ~20.5% of the window height. The production files measured that
//     against the trimmed card, which the holder frame then partly hides; measuring it against
//     the window gives the same band when there is no holder.
//   * The lockup sits one margin below the top of the window, and the band ends the same margin
//     below the lockup's last line, so the green above and below the logo always match. The
//     margin is the one a bare wordmark gets when centred in that 20.5% band.
//   * The department line hangs under the wordmark and wraps by the UNBC logo kit's rule
//     (vendor/unbc-logo, splitDepartmentText at the lockup's 122-unit width), so "Northern
//     Analytical Laboratory Services" breaks after "Analytical". Each department line pushes the
//     band down; the margin under it stays the same.
//   * Some older production files instead ran a long department line past "NORTHERN BRITISH
//     COLUMBIA" on one line. `departmentWrap: 'band'` reproduces those: it wraps at the right
//     edge of the band rather than the lockup.
//   * The wordmark's slanted "U" sits ~2.5% of the width left of the body text column.
//   * NUGSS signs (organization 'nugss') follow the same band rule with the NUGSS logo in place of
//     the lockup. Measured from the NUGSS "Final V1" artboards: the logo is placed at its native
//     size (~15.7% of the card width), whole — wordmark and society name — centred in the band,
//     ~2.5% of the width left of the (wide) body text column, and there is no department line. On those
//     artboards, seen through the 6-352 holder, the band is 20.5% of the window and the blue
//     above the logo matches the blue below it, as on UNBC signs.
//
// Everything here is plain arithmetic in points so it runs under `node --test` as well as in the
// artwork renderer, and the preview, PNG and PDF exports all share it.

import { DEPARTMENT_LINE, LOGO_VIEWBOX, splitDepartmentText } from '../../vendor/unbc-logo/src/logo/logoText.js'
import { NUGSS_LOGO } from '../assets/nugssLogo.js'

export const HEADER_BAND_RATIO = 0.205
export const LOGO_WIDTH_RATIO = 0.355
export const LOGO_TEXT_OFFSET_RATIO = 0.025

// Wordmark ink inside the lockup's 178×80 viewBox (the rest of the box is room for the
// department line).
export const WORDMARK = { top: 15, height: 30.68 }

export const NUGSS_LOGO_WIDTH_RATIO = 0.157
export const NUGSS_LOGO_TEXT_OFFSET_RATIO = 0.025

/**
 * @param {object} options
 * @param {number} options.width      trimmed card width (pt)
 * @param {number} options.height     trimmed card height (pt)
 * @param {object} options.viewable   frame coverage in pt: { top, right, bottom, left }
 * @param {number} options.textX      body text column, measured from the trim's left edge (pt)
 * @param {number} options.rightInset right-hand content padding inside the viewable window (pt)
 * @param {string} options.departmentText
 * @param {'logo'|'band'} [options.departmentWrap] wrap at the lockup width (UNBC rule, default)
 *        or run to the right edge of the band, as some older production files did
 * @param {'unbc'|'nugss'} [options.organization] whose logo sits in the band
 * @returns trim-space geometry: band height, lockup origin/scale, wrapped department lines, the
 *          wrap width (lockup units) the lockup should be rendered with, and the margins above
 *          and below the lockup (for the preview's spacing guides).
 */
export const resolveHeaderGeometry = ({
  width,
  height,
  viewable = {},
  textX,
  rightInset = 0,
  departmentText = '',
  departmentWrap = 'logo',
  organization = 'unbc'
}) => {
  const top = Math.max(viewable.top || 0, 0)
  const bottom = Math.max(viewable.bottom || 0, 0)
  const left = Math.max(viewable.left || 0, 0)
  const right = Math.max(viewable.right || 0, 0)
  const windowHeight = height - top - bottom

  if (organization === 'nugss') {
    const scale = (width * NUGSS_LOGO_WIDTH_RATIO) / NUGSS_LOGO.width
    const logoHeight = NUGSS_LOGO.height * scale
    const margin = Math.max((windowHeight * HEADER_BAND_RATIO - logoHeight) / 2, 0)
    const logoY = top + margin
    return {
      bandHeight: logoY + logoHeight + margin,
      logoX: Math.max(textX - width * NUGSS_LOGO_TEXT_OFFSET_RATIO, left),
      logoY,
      scale,
      departmentLines: [],
      departmentMaxWidth: 0,
      margin,
      wordmarkTop: logoY,
      lockupBottom: logoY + logoHeight
    }
  }

  const scale = (width * LOGO_WIDTH_RATIO) / LOGO_VIEWBOX.width
  const logoX = Math.max(textX - width * LOGO_TEXT_OFFSET_RATIO, left)

  // The margin a bare wordmark gets when centred in the visible band. Never negative, so a tiny
  // window still keeps the frame off the wordmark.
  const wordmarkHeight = WORDMARK.height * scale
  const margin = Math.max((windowHeight * HEADER_BAND_RATIO - wordmarkHeight) / 2, 0)
  const wordmarkTop = top + margin
  const logoY = wordmarkTop - WORDMARK.top * scale

  // By default the department line wraps where the logo kit wraps it. The 'band' option lets it
  // run to the right edge of the live area instead, as some older production files did.
  const departmentX = logoX + DEPARTMENT_LINE.x * scale
  const rightEdge = width - right - rightInset
  const departmentMaxWidth = departmentWrap === 'band'
    ? Math.max((rightEdge - departmentX) / scale, DEPARTMENT_LINE.maxWidth)
    : DEPARTMENT_LINE.maxWidth
  const departmentLines = splitDepartmentText(departmentText || '', departmentMaxWidth)

  // The lockup ends at the wordmark, or at the last department baseline below it; the band runs
  // the same margin past that.
  const lastDepartmentBaseline = DEPARTMENT_LINE.y + (departmentLines.length - 1) * DEPARTMENT_LINE.lineHeight
  const lockupBottom = departmentLines.length
    ? logoY + lastDepartmentBaseline * scale
    : wordmarkTop + wordmarkHeight

  return {
    bandHeight: lockupBottom + margin,
    logoX,
    logoY,
    scale,
    departmentLines,
    departmentMaxWidth,
    margin,
    wordmarkTop,
    lockupBottom
  }
}
