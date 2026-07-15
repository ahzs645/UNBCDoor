import React from 'react'
import badgeRaw from '../assets/alumni-badge.svg?raw'
import { extractSvgInner } from './logoText'

const BADGE_INNER = extractSvgInner(badgeRaw)

// The UNBC Alumni crest as an SVG <g>. `transform` positions/scales it in the parent SVG
// (native 59.27×67.82 viewBox). Fills are presentation attributes so it survives svg2pdf.
export const AlumniCrest = ({ transform, occupant = 'primary' }) => (
  <g
    transform={transform}
    data-alumni-occupant={occupant}
    dangerouslySetInnerHTML={{ __html: BADGE_INNER }}
  />
)
