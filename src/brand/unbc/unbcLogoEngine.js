const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const MAX_CHARS_PER_LINE = 24

export const getAssetPath = (path) => {
  const basePath = import.meta.env.BASE_URL || '/'
  return `${basePath}${path}`
}

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

export const updateUnbcLogoDepartmentText = (container, departmentText) => {
  const textElement = container?.querySelector('#svgDepartmentText')

  if (!textElement) {
    return
  }

  const lines = splitDepartmentText(departmentText)
  textElement.innerHTML = ''

  lines.forEach((line, index) => {
    const tspan = document.createElementNS(SVG_NAMESPACE, 'tspan')
    tspan.setAttribute('x', '0')
    tspan.setAttribute('y', `${index * 10}`)
    tspan.textContent = line
    textElement.appendChild(tspan)
  })

  const logoGroup = container?.querySelector('#logoAndTextGroup')

  if (logoGroup) {
    logoGroup.setAttribute('transform', lines.length >= 3 ? 'translate(0, 5)' : 'translate(0, 15)')
  }
}
