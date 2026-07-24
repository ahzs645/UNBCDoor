import React from 'react'
import { PAPER_ORDER, PAPER_DIMENSIONS } from '../sign/signConstants'

// Paper size selection, an optional print-fit warning, and the PNG / print-ready PDF buttons
// plus the blank measuring template. Paper options are derived from PAPER_DIMENSIONS so
// adding a sheet there surfaces it here.
export const SignExportControls = ({
  paperSize,
  onPaperSizeChange,
  onExportPNG,
  onExportPDF,
  onExportTemplate,
  hasCardHolder,
  fitWarning
}) => (
  <div className="export-section">
    <div className="paper-size-selector">
      <label>Paper Size:</label>
      <div className="paper-size-options">
        {PAPER_ORDER.map((key) => (
          <label key={key} className={`paper-option ${paperSize === key ? 'active' : ''}`}>
            <input
              type="radio"
              name="paperSize"
              value={key}
              checked={paperSize === key}
              onChange={(e) => onPaperSizeChange(e.target.value)}
            />
            {PAPER_DIMENSIONS[key].label}
          </label>
        ))}
      </div>
    </div>

    {fitWarning && (
      <p className="print-fit-warning" role="alert">{fitWarning}</p>
    )}

    <div className="export-buttons">
      <button type="button" onClick={onExportPNG} className="export-btn">
        Export as PNG
      </button>
      <button type="button" onClick={onExportPDF} className="export-btn pdf-export">
        Export as PDF (Print-Ready)
      </button>
    </div>

    <div className="template-export">
      <button type="button" onClick={onExportTemplate} className="export-btn template-export__btn">
        Print holder template (PDF)
      </button>
      <p className="template-export__hint">
        {hasCardHolder
          ? 'A blank 1:1 measuring sheet for this holder: bleed, cut line, the viewable window, and the strips the frame hides — with every dimension labelled. Print at 100%, cut it out, and drop it in the holder to check the numbers.'
          : 'A blank 1:1 measuring sheet with the bleed, cut line and safe area. Select a card holder above to include its viewable window and frame coverage.'}
      </p>
    </div>
  </div>
)
