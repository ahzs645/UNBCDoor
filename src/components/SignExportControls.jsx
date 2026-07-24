import React from 'react'
import { PAPER_ORDER, PAPER_DIMENSIONS } from '../sign/signConstants'

// Paper size selection, an optional print-fit warning, the PNG / print-ready PDF buttons, and
// a pointer to the measuring sheets page. Paper options are derived from PAPER_DIMENSIONS so
// adding a sheet there surfaces it here.
export const SignExportControls = ({
  paperSize,
  onPaperSizeChange,
  onExportPNG,
  onExportPDF,
  measuringSheetsHref,
  onOpenMeasuringSheets,
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

    <p className="template-export__link">
      Need to check a holder? <a href={measuringSheetsHref} onClick={onOpenMeasuringSheets}>Measuring sheets</a>{' '}
      prints a 1:1 template of the selected holder, or a grid you cut down to measure one that
      has no preset yet.
    </p>
  </div>
)
