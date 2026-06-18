// Geometry of the UNBC logo lockup, in the logo's own 178×80 viewBox coordinates.
// The department line sits where the original artwork's (empty) #svgDepartmentText element was:
// inside logoAndTextGroup (translate 0,15) at translate(57.73, 36.56) → viewBox (57.73, 51.56),
// font-size 8.23, weight 800, white — left-aligned under the "NORTHERN BRITISH COLUMBIA" line.
export const LOGO_VIEWBOX = { width: 178, height: 80 }
export const DEPARTMENT_LINE = {
  x: 57.73,
  y: 51.56,
  lineHeight: 10,
  fontSize: 8.23,
  fontWeight: 800
}

const MAX_CHARS_PER_LINE = 24

export const splitDepartmentText = (departmentText, maxCharsPerLine = MAX_CHARS_PER_LINE) => {
  if (!departmentText) {
    return []
  }

  const words = departmentText.split(' ')
  const lines = []
  let currentLine = ''

  words.forEach((word) => {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word
      return
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    currentLine = word
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

// Pulls the inner markup out of a raw-imported SVG so it can be inlined into a <g>.
export const extractSvgInner = (svgText) =>
  svgText.replace(/^[\s\S]*?<svg[^>]*>/i, '').replace(/<\/svg>\s*$/i, '')
