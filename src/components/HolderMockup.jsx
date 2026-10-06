import React from 'react'
import { BLEED_INCHES } from '../sign/signConstants'

// The sign as it hangs on the door: the black room plate (room number, and on older plates a
// coloured rule and a braille strip) with the printed insert behind its window. Only the window
// shows the insert, so anything the holder frame covers is hidden here exactly as it will be on
// the wall.
//
// The plate is sized from the holder window and proportioned after the plates on campus: about
// half an inch of frame at the sides and bottom, and a room-number panel above.

const PLATE = {
  side: 0.45,
  bottom: 0.5
}

// The plates in use. Newer ones are plain black: just the number, then the window. Older ones
// add a rule under the number (grey in Building 4, green in Building 7) and a braille strip.
export const PLATE_STYLES = {
  plain: { label: 'Number only', numberPanel: 1.95, rule: 0, aboveWindow: 0.4, braille: false },
  grey: { label: 'Grey line + braille', numberPanel: 1.85, rule: 0.16, aboveWindow: 0.38, braille: true, ruleColors: ['#c9ccd1', '#9a9ea5', '#7d8189'] },
  green: { label: 'Green line + braille', numberPanel: 1.85, rule: 0.13, aboveWindow: 0.38, braille: true, ruleColors: ['#2f7d63', '#1d6650', '#145442'] }
}

// Six-dot braille cells (dots 1–3 down the left, 4–6 down the right) for what a room number
// can contain. Digits follow the number sign and reuse the cells for a–j.
const LETTER_DOTS = {
  a: [1], b: [1, 2], c: [1, 4], d: [1, 4, 5], e: [1, 5], f: [1, 2, 4], g: [1, 2, 4, 5],
  h: [1, 2, 5], i: [2, 4], j: [2, 4, 5]
}
const withDots = (letters, extra) => Object.fromEntries(
  Object.entries(letters).map(([letter, dots]) => [letter, [...dots, ...extra]])
)
const SECOND_DECADE = withDots(LETTER_DOTS, [3])
const BRAILLE = {
  ...LETTER_DOTS,
  ...Object.fromEntries(Object.entries(SECOND_DECADE).map(([letter, dots], index) => [
    String.fromCharCode('k'.charCodeAt(0) + index), dots
  ])),
  u: [1, 3, 6], v: [1, 2, 3, 6], w: [2, 4, 5, 6], x: [1, 3, 4, 6], y: [1, 3, 4, 5, 6], z: [1, 3, 5, 6],
  '-': [3, 6]
}
const DIGIT_LETTERS = 'jabcdefghi'
const NUMBER_SIGN = [3, 4, 5, 6]

const brailleCells = (text) => {
  const cells = []
  let inNumber = false
  for (const char of text.toLowerCase()) {
    if (/[0-9]/.test(char)) {
      if (!inNumber) cells.push(NUMBER_SIGN)
      inNumber = true
      cells.push(BRAILLE[DIGIT_LETTERS[Number(char)]])
    } else {
      inNumber = char === '-' ? inNumber : false
      if (BRAILLE[char]) cells.push(BRAILLE[char])
    }
  }
  return cells
}

const BrailleStrip = ({ text, x, y, width, height }) => {
  const cells = brailleCells(text).slice(0, 10)
  const dot = height * 0.075
  const pitchY = height * 0.2
  const pitchX = pitchY
  const cellWidth = pitchX * 2.4
  const startX = x + width - height * 0.3 - cells.length * cellWidth
  const startY = y + height / 2 - pitchY
  return (
    <g>
      <rect className="holder-mockup__braille" x={x} y={y} width={width} height={height} rx={height * 0.14} />
      {cells.map((dots, cellIndex) => dots.map((dotNumber) => {
        const column = dotNumber > 3 ? 1 : 0
        const row = (dotNumber - 1) % 3
        return (
          <circle
            key={`${cellIndex}-${dotNumber}`}
            className="holder-mockup__dot"
            cx={startX + cellIndex * cellWidth + column * pitchX}
            cy={startY + row * pitchY}
            r={dot}
          />
        )
      }))}
    </g>
  )
}

const formatInches = (value) => `${Number(value.toFixed(3))}"`

// One label per frame edge, sitting on the plate just outside the cut edge.
const HiddenLabels = ({ trim, offset, size }) => {
  const labels = [
    { edge: 'top', x: trim.x + trim.width / 2, y: trim.y - size * 0.45, angle: 0 },
    { edge: 'bottom', x: trim.x + trim.width / 2, y: trim.y + trim.height + size * 1.15, angle: 0 },
    { edge: 'left', x: trim.x - size * 0.45, y: trim.y + trim.height / 2, angle: -90 },
    { edge: 'right', x: trim.x + trim.width + size * 0.45, y: trim.y + trim.height / 2, angle: 90 }
  ]
  return labels
    .filter(({ edge }) => offset[edge] > 0)
    .map(({ edge, x, y, angle }) => (
      <text
        key={edge}
        className="holder-mockup__hidden-label"
        x={x}
        y={y}
        fontSize={size}
        textAnchor="middle"
        transform={angle ? `rotate(${angle} ${x} ${y})` : undefined}
      >
        {`${formatInches(offset[edge])} hidden`}
      </text>
    ))
}

// `seeThrough` turns the frame translucent so the whole cut insert shows, with the cut edge
// dashed and each edge labelled with how much of the card the frame covers there.
export const HolderMockup = ({
  insertSize,
  viewableOffset,
  roomNumber,
  plateStyle = 'plain',
  seeThrough = false,
  children
}) => {
  const plate = PLATE_STYLES[plateStyle] || PLATE_STYLES.plain
  const offset = viewableOffset || { top: 0, right: 0, bottom: 0, left: 0 }
  const windowWidth = insertSize.width - offset.left - offset.right
  const windowHeight = insertSize.height - offset.top - offset.bottom

  // The insert slides in behind the frame, so the plate always reaches a little past the cut card,
  // even on a holder whose frame covers more than the usual border.
  const clearance = 0.12
  const side = Math.max(PLATE.side, offset.left + clearance, offset.right + clearance)
  const bottom = Math.max(PLATE.bottom, offset.bottom + clearance)
  const aboveWindow = Math.max(plate.aboveWindow, offset.top + clearance)

  const windowRect = {
    x: side,
    y: plate.numberPanel + plate.rule + aboveWindow,
    width: windowWidth,
    height: windowHeight
  }
  const trim = {
    x: windowRect.x - offset.left,
    y: windowRect.y - offset.top,
    width: insertSize.width,
    height: insertSize.height
  }
  const plateWidth = windowWidth + side * 2
  const plateHeight = windowRect.y + windowHeight + bottom

  const percentOfPlate = (rect) => ({
    left: `${(rect.x / plateWidth) * 100}%`,
    top: `${(rect.y / plateHeight) * 100}%`,
    width: `${(rect.width / plateWidth) * 100}%`,
    height: `${(rect.height / plateHeight) * 100}%`
  })

  // The artwork canvas includes the bleed; the cut card crops it off.
  const insertStyle = {
    left: `${(-BLEED_INCHES / insertSize.width) * 100}%`,
    top: `${(-BLEED_INCHES / insertSize.height) * 100}%`,
    width: `${((insertSize.width + BLEED_INCHES * 2) / insertSize.width) * 100}%`,
    height: `${((insertSize.height + BLEED_INCHES * 2) / insertSize.height) * 100}%`
  }

  const rectPath = ({ x, y, width, height }) => `M${x} ${y}h${width}v${height}h${-width}Z`
  const framePath = `${rectPath(trim)} ${rectPath(windowRect)}`
  const hidesAnything = offset.top + offset.right + offset.bottom + offset.left > 0

  const label = (roomNumber || '').trim()
  const numberSize = plate.numberPanel * 0.62
  const numberBaseline = plate.numberPanel * 0.74
  const brailleWidth = Math.min(1.9, plateWidth * 0.26)
  const brailleHeight = 0.36

  return (
    <div
      className={`holder-mockup ${seeThrough ? 'is-see-through' : ''}`}
      style={{ '--plate-aspect': plateWidth / plateHeight }}
    >
      <svg
        className="holder-mockup__plate"
        viewBox={`0 0 ${plateWidth} ${plateHeight}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {plate.rule > 0 && (
          <defs>
            <linearGradient id={`holder-mockup-rule-${plateStyle}`} x1="0" y1="0" x2="0" y2="1">
              {plate.ruleColors.map((color, index) => (
                <stop key={color} offset={index / (plate.ruleColors.length - 1)} stopColor={color} />
              ))}
            </linearGradient>
          </defs>
        )}
        <rect className="holder-mockup__body" x="0" y="0" width={plateWidth} height={plateHeight} rx="0.05" />
        <text
          className={`holder-mockup__number ${label ? '' : 'is-placeholder'}`}
          x={side * 0.9}
          y={numberBaseline}
          fontSize={numberSize}
        >
          {label || '0-000'}
        </text>
        {plate.braille && (
          <BrailleStrip
            text={label || '0-000'}
            x={plateWidth - side - brailleWidth}
            y={numberBaseline - brailleHeight - 0.08}
            width={brailleWidth}
            height={brailleHeight}
          />
        )}
        {plate.rule > 0 && (
          <rect
            x="0"
            y={plate.numberPanel}
            width={plateWidth}
            height={plate.rule}
            fill={`url(#holder-mockup-rule-${plateStyle})`}
          />
        )}
      </svg>

      {/* The whole cut card, at its real place behind the frame. */}
      <div className="holder-mockup__card" style={percentOfPlate(trim)}>
        <div className="holder-mockup__insert" style={insertStyle}>
          {children}
        </div>
      </div>

      {!seeThrough && <div className="holder-mockup__window" style={percentOfPlate(windowRect)} />}

      <svg
        className="holder-mockup__frame"
        viewBox={`0 0 ${plateWidth} ${plateHeight}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {seeThrough && (
          <defs>
            <pattern id="holder-mockup-hatch" patternUnits="userSpaceOnUse" width="0.08" height="0.08" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="0.08" className="holder-mockup__hatch-line" />
            </pattern>
          </defs>
        )}
        {hidesAnything && <path className="holder-mockup__frame-fill" d={framePath} fillRule="evenodd" />}
        {seeThrough && hidesAnything && (
          <path d={framePath} fillRule="evenodd" fill="url(#holder-mockup-hatch)" />
        )}
        {seeThrough && (
          <>
            <path className="holder-mockup__frame-edge" d={rectPath(windowRect)} />
            <path className="holder-mockup__cut-edge" d={rectPath(trim)} />
            <HiddenLabels trim={trim} offset={offset} size={0.13} />
          </>
        )}
      </svg>
    </div>
  )
}
