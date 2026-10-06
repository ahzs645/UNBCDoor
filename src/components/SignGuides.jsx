import React, { useId } from 'react'
import { layoutSignArtwork } from '../sign/SignArtwork'
import { PT_PER_INCH, SAFE_INCHES } from '../sign/signConstants'

// Print guides drawn over the artwork in its own canvas points, from the same layout the artwork
// is drawn with:
//
//   * outside the cut line — the bleed that gets trimmed away — is washed out and hatched, so the
//     card visibly ends at the cut;
//   * the cut line itself is a dashed line with a white underlay, readable on green and white;
//   * with a holder, the strip of the trimmed card the frame hides is shaded dark, so the
//     window is simply the part still in full colour;
//   * the margins: green above and below the logo, white above and below the body text.

const RECT_PATH = ({ x, y, width, height }) => `M${x} ${y}h${width}v${height}h${-width}Z`

const inches = (points) => `${(points / PT_PER_INCH).toFixed(2)}"`

// A vertical dimension: end ticks and a pill label beside the line. `side` puts the label to the
// right or left of the line.
const Dimension = ({ x, from, to, side = 'right', unit }) => {
  const length = to - from
  if (!(length > 0.5)) return null
  const text = inches(length)
  const pillWidth = unit * 5.6
  const pillHeight = unit * 2.1
  const pillX = side === 'right' ? x + unit * 0.7 : x - unit * 0.7 - pillWidth
  const midY = from + length / 2
  return (
    <g className="sign-guides__dimension">
      <line x1={x} y1={from} x2={x} y2={to} />
      <line x1={x - unit * 0.6} y1={from} x2={x + unit * 0.6} y2={from} />
      <line x1={x - unit * 0.6} y1={to} x2={x + unit * 0.6} y2={to} />
      <rect x={pillX} y={midY - pillHeight / 2} width={pillWidth} height={pillHeight} rx={pillHeight / 2} />
      <text x={pillX + pillWidth / 2} y={midY} fontSize={unit * 1.35} textAnchor="middle" dominantBaseline="central">
        {text}
      </text>
    </g>
  )
}

export const SignGuides = ({ content, hasHolder }) => {
  const id = useId().replace(/:/g, '')
  const layout = layoutSignArtwork(content)
  const { BLEED, CW, CH, W, H, VL, VT, VW, VH, PAD_X, header, HEADER_H, originX, originY, body } = layout

  const canvas = { x: 0, y: 0, width: CW, height: CH }
  const trim = { x: BLEED, y: BLEED, width: W, height: H }
  const viewWindow = { x: originX, y: originY, width: VW, height: VH }
  const safeInset = SAFE_INCHES * PT_PER_INCH
  const safe = {
    x: trim.x + safeInset,
    y: trim.y + safeInset,
    width: trim.width - safeInset * 2,
    height: trim.height - safeInset * 2
  }
  const showFrame = hasHolder && (VL > 0 || VT > 0 || VW < W || VH < H)

  // Guide furniture scales with the card so it reads the same on every holder size.
  const unit = W / 100
  const windowBottom = originY + VH
  const headerX = originX + VW - PAD_X * 0.3
  const bodyX = originX + PAD_X * 0.3

  return (
    <svg
      className="sign-guides"
      viewBox={`0 0 ${CW} ${CH}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <pattern id={`${id}-hatch`} patternUnits="userSpaceOnUse" width={unit * 1.2} height={unit * 1.2} patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2={unit * 1.2} className="sign-guides__hatch-line" />
        </pattern>
      </defs>

      {/* Bleed: printed, then cut away. */}
      <path className="sign-guides__bleed" d={`${RECT_PATH(canvas)} ${RECT_PATH(trim)}`} fillRule="evenodd" />
      <path d={`${RECT_PATH(canvas)} ${RECT_PATH(trim)}`} fillRule="evenodd" fill={`url(#${id}-hatch)`} />

      {/* The part of the cut card the holder frame covers. */}
      {showFrame && (
        <path className="sign-guides__frame" d={`${RECT_PATH(trim)} ${RECT_PATH(viewWindow)}`} fillRule="evenodd" />
      )}
      {showFrame && <path className="sign-guides__window" d={RECT_PATH(viewWindow)} />}

      {!hasHolder && <path className="sign-guides__safe" d={RECT_PATH(safe)} />}

      <path className="sign-guides__cut-underlay" d={RECT_PATH(trim)} />
      <path className="sign-guides__cut" d={RECT_PATH(trim)} />

      {/* Header: green above the wordmark matches the green below the lockup. */}
      <Dimension
        x={headerX}
        from={BLEED + VT}
        to={BLEED + header.wordmarkTop}
        side="left"
        unit={unit}
      />
      <Dimension
        x={headerX}
        from={BLEED + header.lockupBottom}
        to={BLEED + header.bandHeight}
        side="left"
        unit={unit}
      />

      {/* Body: white above the first line matches the white below the last. */}
      {body && (
        <>
          <Dimension x={bodyX} from={originY + HEADER_H} to={originY + body.inkTop} unit={unit} />
          <Dimension x={bodyX} from={originY + body.inkBottom} to={windowBottom} unit={unit} />
        </>
      )}
    </svg>
  )
}
