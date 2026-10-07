import React from 'react'
import { NUGSS_LOGO } from '../assets/nugssLogo'

// The NUGSS logo as SVG paths, at its native size (points) with the ink's top-left at 0,0. White
// by default, as it sits on the cerulean band; pass `fill` for the logo on a light background.
export const NugssLogoMark = ({ fill = '#ffffff', ...props }) => (
  <g fill={fill} {...props}>
    <path d={NUGSS_LOGO.wordmark} />
    <path d={NUGSS_LOGO.name} />
  </g>
)
