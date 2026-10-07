import React from 'react'
import { SignArtwork } from '../sign/SignArtwork'
import { PT_PER_INCH } from '../sign/signConstants'

// One printed sheet, drawn from the same layout the PDF exporter uses: the paper, each card at
// its slot (clipped to the part of the sheet it prints on), the cut lines over them, the crop
// marks in the margin and the footer. Empty slots are outlined so the sheet's capacity shows.
export const SheetPreview = ({ page, showLabel, showScale, footerText }) => {
  const { sheet, items } = page
  const B = sheet.bleed
  const cards = items.filter(Boolean).length

  return (
    <svg
      className="sheet-preview__page"
      viewBox={`0 0 ${sheet.pageWidth} ${sheet.pageHeight}`}
      role="img"
      aria-label={`${sheet.paperSize} sheet, ${cards} of ${sheet.perSheet} card${sheet.perSheet === 1 ? '' : 's'}`}
    >
      <rect width={sheet.pageWidth} height={sheet.pageHeight} fill="#ffffff" />

      {sheet.slots.map((slot, index) => {
        const item = items[index]
        const { width: W, height: H } = slot
        if (!item) {
          return (
            <rect
              key={index}
              className="sheet-preview__empty"
              x={slot.x}
              y={slot.y}
              width={W}
              height={H}
            />
          )
        }
        const { clip } = slot
        return (
          // The outer viewport clips the card to its region; the inner one places the card's
          // bleed box, which the artwork fills.
          <svg
            key={index}
            x={clip.x}
            y={clip.y}
            width={clip.width}
            height={clip.height}
            viewBox={`${clip.x} ${clip.y} ${clip.width} ${clip.height}`}
          >
            <svg x={slot.x - B} y={slot.y - B} width={W + B * 2} height={H + B * 2}>
              <SignArtwork content={item.content} />
            </svg>
          </svg>
        )
      })}

      {sheet.cutLines.map(([x1, y1, x2, y2], index) => (
        <line key={`cut-${index}`} className="sheet-preview__cut" x1={x1} y1={y1} x2={x2} y2={y2} />
      ))}
      {sheet.cropMarks.map(([x1, y1, x2, y2], index) => (
        <line key={`mark-${index}`} className="sheet-preview__mark" x1={x1} y1={y1} x2={x2} y2={y2} />
      ))}

      {sheet.footer && (showLabel || showScale) && (
        <g className="sheet-preview__footer">
          {showScale && (
            <path
              d={`M${sheet.footer.left} ${sheet.footer.baseline - 6.5}v4h${PT_PER_INCH}v-4M${sheet.footer.left + PT_PER_INCH / 2} ${sheet.footer.baseline - 5.5}v3`}
              fill="none"
            />
          )}
          <text x={sheet.footer.left + (showScale ? PT_PER_INCH + 4 : 0)} y={sheet.footer.baseline} fontSize="7">
            {showScale && '1 in — check at 100%'}
            {showLabel && footerText && <tspan dx={showScale ? 12 : 0}>{footerText}</tspan>}
          </text>
        </g>
      )}
    </svg>
  )
}
