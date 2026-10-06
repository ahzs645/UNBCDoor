import React from 'react'
import { BLEED_INCHES } from '../sign/signConstants'

// The sign as it hangs on the door: the black room plate (room number, braille strip, grey rule)
// with the printed insert behind its window. Only the window shows the insert, so anything the
// holder frame covers is hidden here exactly as it will be on the wall.
//
// The plate is sized from the holder window and proportioned after the plates in Building 4:
// about half an inch of frame at the sides and bottom, and a room-number panel above.

const PLATE = {
  side: 0.45,
  bottom: 0.5,
  aboveWindow: 0.38,
  rule: 0.16,
  numberPanel: 1.85
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

export const HolderMockup = ({ insertSize, viewableOffset, roomNumber, children }) => {
  const offset = viewableOffset || { top: 0, right: 0, bottom: 0, left: 0 }
  const windowWidth = insertSize.width - offset.left - offset.right
  const windowHeight = insertSize.height - offset.top - offset.bottom

  const windowX = PLATE.side
  const windowY = PLATE.numberPanel + PLATE.rule + PLATE.aboveWindow
  const plateWidth = windowWidth + PLATE.side * 2
  const plateHeight = windowY + windowHeight + PLATE.bottom

  // The artwork canvas includes the bleed, so it is shifted out past the window by the frame
  // inset plus the bleed and clipped by the window.
  const canvasWidth = insertSize.width + BLEED_INCHES * 2
  const canvasHeight = insertSize.height + BLEED_INCHES * 2
  const insertStyle = {
    left: `${(-(offset.left + BLEED_INCHES) / windowWidth) * 100}%`,
    top: `${(-(offset.top + BLEED_INCHES) / windowHeight) * 100}%`,
    width: `${(canvasWidth / windowWidth) * 100}%`,
    height: `${(canvasHeight / windowHeight) * 100}%`
  }
  const windowStyle = {
    left: `${(windowX / plateWidth) * 100}%`,
    top: `${(windowY / plateHeight) * 100}%`,
    width: `${(windowWidth / plateWidth) * 100}%`,
    height: `${(windowHeight / plateHeight) * 100}%`
  }

  const label = (roomNumber || '').trim()
  const numberSize = PLATE.numberPanel * 0.62
  const numberBaseline = PLATE.numberPanel * 0.74
  const brailleWidth = Math.min(1.9, plateWidth * 0.26)
  const brailleHeight = 0.36

  return (
    <div className="holder-mockup" style={{ '--plate-aspect': plateWidth / plateHeight }}>
      <svg
        className="holder-mockup__plate"
        viewBox={`0 0 ${plateWidth} ${plateHeight}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="holder-mockup-rule" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c9ccd1" />
            <stop offset="0.5" stopColor="#9a9ea5" />
            <stop offset="1" stopColor="#7d8189" />
          </linearGradient>
        </defs>
        <rect className="holder-mockup__body" x="0" y="0" width={plateWidth} height={plateHeight} rx="0.05" />
        <text
          className={`holder-mockup__number ${label ? '' : 'is-placeholder'}`}
          x={PLATE.side * 0.9}
          y={numberBaseline}
          fontSize={numberSize}
        >
          {label || '0-000'}
        </text>
        <BrailleStrip
          text={label || '0-000'}
          x={plateWidth - PLATE.side - brailleWidth}
          y={numberBaseline - brailleHeight - 0.08}
          width={brailleWidth}
          height={brailleHeight}
        />
        <rect x="0" y={PLATE.numberPanel} width={plateWidth} height={PLATE.rule} fill="url(#holder-mockup-rule)" />
      </svg>

      <div className="holder-mockup__window" style={windowStyle}>
        <div className="holder-mockup__insert" style={insertStyle}>
          {children}
        </div>
      </div>
    </div>
  )
}
