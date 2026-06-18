import React from 'react'
import logoRaw from '../assets/unbc-logo.svg?raw'
import { DEPARTMENT_LINE, extractSvgInner, splitDepartmentText } from './logoText'

const LOGO_INNER = extractSvgInner(logoRaw)

// The UNBC wordmark lockup as an SVG <g>, optionally with a bold white department line under the
// "University of Northern British Columbia" subtitle (the manual "School of Engineering" header
// treatment). `transform` positions/scales it in the parent SVG; coordinates are the logo's
// native 178×80 viewBox, so the department line stays aligned with the subtitle at any scale.
export const UnbcLogoMark = ({ transform, departmentText = '', fontFamily }) => {
  const lines = splitDepartmentText(departmentText)

  return (
    <g transform={transform}>
      <g dangerouslySetInnerHTML={{ __html: LOGO_INNER }} />
      {lines.map((line, index) => (
        <text
          key={index}
          x={DEPARTMENT_LINE.x}
          y={DEPARTMENT_LINE.y + index * DEPARTMENT_LINE.lineHeight}
          fontFamily={fontFamily}
          fontSize={DEPARTMENT_LINE.fontSize}
          fontWeight={DEPARTMENT_LINE.fontWeight}
          fill="#ffffff"
        >
          {line}
        </text>
      ))}
    </g>
  )
}
