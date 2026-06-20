import React from 'react'

// Paper size selection plus the PNG / print-ready PDF export buttons.
export const SignExportControls = ({
  paperSize,
  onPaperSizeChange,
  onExportPNG,
  onExportPDF
}) => (
  <div className="export-section">
    <div className="paper-size-selector">
      <label>Paper Size:</label>
      <div className="paper-size-options">
        <label className={`paper-option ${paperSize === 'letter' ? 'active' : ''}`}>
          <input
            type="radio"
            name="paperSize"
            value="letter"
            checked={paperSize === 'letter'}
            onChange={(e) => onPaperSizeChange(e.target.value)}
          />
          Letter (8.5" × 11")
        </label>
        <label className={`paper-option ${paperSize === 'a4' ? 'active' : ''}`}>
          <input
            type="radio"
            name="paperSize"
            value="a4"
            checked={paperSize === 'a4'}
            onChange={(e) => onPaperSizeChange(e.target.value)}
          />
          A4 (210mm × 297mm)
        </label>
      </div>
    </div>
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
