import React from 'react'
import { PAPER_ORDER, PAPER_DIMENSIONS } from '../sign/signConstants'

// Paper size selection, an optional print-fit warning, and the PNG / print-ready PDF buttons.
// Paper options are derived from PAPER_DIMENSIONS so adding a sheet there surfaces it here.
export const SignExportControls = ({
  paperSize,
  onPaperSizeChange,
  onExportPNG,
  onExportPDF,
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
  </div>
)
