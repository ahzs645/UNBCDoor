import { PT_PER_INCH } from './signConstants.js'
import { MM_PER_INCH, PAGE_MARGIN } from './templateGeometry.js'

export { PAGE_MARGIN }

// Low-level drawing helpers shared by the printable measuring sheets (signTemplate.js and
// signGrid.js). jsPDF primitives only — standard Helvetica, no embedded faces, no DOM — so
// the sheets stay synchronous and independent of the artwork exporters.

export const INK = [17, 17, 17]
export const MUTED = [110, 110, 110]
export const BLEED_INK = [155, 155, 155]
export const WINDOW_INK = [3, 86, 66]
export const HIDDEN_FILL = [246, 238, 238]
export const HIDDEN_INK = [176, 110, 110]
export const ALERT_INK = [139, 0, 0]
export const RULE_INK = [225, 225, 225]
export const GRID_FINE_INK = [205, 213, 218]
export const GRID_MAJOR_INK = [120, 132, 140]

// Distinct outline colours for the known holder presets drawn on the cutting grid.
export const PRESET_INKS = [
  [3, 86, 66],
  [40, 88, 160],
  [176, 96, 96],
  [126, 78, 152]
]

export const setDash = (doc, pattern = []) => {
  if (typeof doc.setLineDashPattern === 'function') {
    doc.setLineDashPattern(pattern, 0)
  }
}

export const stroke = (doc, color, width, dash = []) => {
  doc.setDrawColor(color[0], color[1], color[2])
  doc.setLineWidth(width)
  setDash(doc, dash)
}

export const strokeRect = (doc, rect) => doc.rect(rect.x, rect.y, rect.width, rect.height, 'S')

export const write = (doc, string, x, y, { size = 8, color = MUTED, align = 'left', style = 'normal', angle } = {}) => {
  doc.setFont('helvetica', style)
  doc.setFontSize(size)
  doc.setTextColor(color[0], color[1], color[2])
  doc.text(string, x, y, angle ? { align, angle } : { align })
}

// Text centred on (x, y) and knocked out of whatever it crosses, so labels stay readable over
// guides, grid lines and hatching. jsPDF only honours `align` for unrotated text and always
// runs rotated text upward from its anchor, so the rotated case is positioned by hand: the
// anchor moves half the string's length down the line, and across it by the amount that
// centres the glyph band (ascent above the baseline, descent below).
const CAP_CENTRE_RATIO = 0.385
const GLYPH_HALF_RATIO = 0.7

export const label = (doc, string, x, y, { size = 7, color = INK, style = 'normal', angle = 0, align = 'center' } = {}) => {
  doc.setFont('helvetica', style)
  doc.setFontSize(size)
  const width = doc.getTextWidth(string)
  const half = size * GLYPH_HALF_RATIO + 1.5

  doc.setFillColor(255, 255, 255)
  if (angle) {
    doc.rect(x - half, y - width / 2 - 2, half * 2, width + 4, 'F')
    write(doc, string, x + size * CAP_CENTRE_RATIO, y + width / 2, { size, color, style, angle })
  } else {
    // `align` only shifts the horizontal anchor; the vertical centring is the same either way.
    doc.rect(align === 'left' ? x - 2 : x - width / 2 - 2, y - half, width + 4, half * 2, 'F')
    write(doc, string, x, y + size * CAP_CENTRE_RATIO, { size, color, style, align })
  }
}

export const arrowHead = (doc, x, y, dx, dy, color) => {
  const length = 5
  const half = 2
  const baseX = x - dx * length
  const baseY = y - dy * length
  const leftX = baseX - dy * half
  const leftY = baseY + dx * half
  const rightX = baseX + dy * half
  const rightY = baseY - dx * half

  if (typeof doc.triangle === 'function') {
    doc.setFillColor(color[0], color[1], color[2])
    doc.triangle(x, y, leftX, leftY, rightX, rightY, 'F')
    return
  }

  stroke(doc, color, 0.6)
  doc.line(x, y, leftX, leftY)
  doc.line(x, y, rightX, rightY)
}

// An arrowed dimension line, optionally with extension leaders back to the edge it measures.
export const dimension = (doc, { axis, from, to, at, edge, text, color = INK }) => {
  if (to - from < 12) return

  if (typeof edge === 'number') {
    stroke(doc, BLEED_INK, 0.4, [1.5, 1.5])
    if (axis === 'x') {
      doc.line(from, edge, from, at)
      doc.line(to, edge, to, at)
    } else {
      doc.line(edge, from, at, from)
      doc.line(edge, to, at, to)
    }
  }

  stroke(doc, color, 0.6)
  if (axis === 'x') {
    doc.line(from, at, to, at)
    arrowHead(doc, from, at, -1, 0, color)
    arrowHead(doc, to, at, 1, 0, color)
    label(doc, text, (from + to) / 2, at, { color })
  } else {
    doc.line(at, from, at, to)
    arrowHead(doc, at, from, 0, -1, color)
    arrowHead(doc, at, to, 0, 1, color)
    label(doc, text, at, (from + to) / 2, { color, angle: 90 })
  }
}

// 45° fill, clipped to the rectangle by hand (jsPDF has no pattern fills).
export const hatch = (doc, rect, spacing = 5) => {
  const span = rect.width + rect.height
  for (let offset = spacing; offset < span; offset += spacing) {
    doc.line(
      rect.x + Math.min(offset, rect.width),
      rect.y + Math.max(offset - rect.width, 0),
      rect.x + Math.max(offset - rect.height, 0),
      rect.y + Math.min(offset, rect.height)
    )
  }
}

// Scale-check rulers. If these don't measure true the sheet was scaled by the print dialog and
// every other number on it is wrong, so every measuring sheet carries a pair.
export const drawScaleRulers = (doc, y, pageWidth, caption = 'Scale check — these bars must measure exactly:') => {
  const gap = 26
  const captionWidth = 74
  const full = { inches: 4, millimetres: 100 }
  const compact = { inches: 2, millimetres: 50 }
  const available = pageWidth - PAGE_MARGIN * 2 - gap - captionWidth
  const needed = (bar) => (bar.inches + bar.millimetres / MM_PER_INCH) * PT_PER_INCH
  const scale = needed(full) <= available ? full : compact

  const drawTicks = (x, unitLength, units, subdivisions, text) => {
    stroke(doc, INK, 0.6)
    doc.line(x, y, x + unitLength * units, y)
    for (let step = 0; step <= units * subdivisions; step += 1) {
      const tickX = x + (step / subdivisions) * unitLength
      const major = step % subdivisions === 0
      const half = step % (subdivisions / 2) === 0
      stroke(doc, INK, major ? 0.6 : 0.35)
      doc.line(tickX, y, tickX, y - (major ? 9 : half ? 5.5 : 3))
      if (major) {
        write(doc, `${step / subdivisions}`, tickX, y - 11, { size: 6, color: MUTED, align: 'center' })
      }
    }
    write(doc, text, x + unitLength * units + 6, y, { size: 7.5, color: INK, style: 'bold' })
  }

  write(doc, caption, PAGE_MARGIN, y - 20, { size: 7.5, color: MUTED })

  drawTicks(PAGE_MARGIN, PT_PER_INCH, scale.inches, 8, `${scale.inches} in`)
  const mmStart = PAGE_MARGIN + scale.inches * PT_PER_INCH + 42 + gap
  drawTicks(mmStart, PT_PER_INCH / MM_PER_INCH * 10, scale.millimetres / 10, 10, `${scale.millimetres} mm`)
}

export const fileSlug = (value, fallback = 'holder') => (value || fallback)
  .toString()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || fallback
