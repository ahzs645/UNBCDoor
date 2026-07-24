import React from 'react'
import { PAPER_ORDER, PAPER_DIMENSIONS } from '../sign/signConstants'

// The three measuring sheets, in order of how much you already know about the holder.
export const TEMPLATE_MODES = [
  {
    value: 'template',
    label: 'Holder template',
    hint: 'A blank 1:1 sheet for the selected holder: bleed, cut line, the viewable window, and the strips the frame hides, every dimension labelled. Print at 100%, cut it out, and drop it in the holder to check the numbers.',
    hintWithoutHolder: 'A blank 1:1 sheet with the bleed, cut line and safe area. Select a card holder above to include its viewable window and frame coverage.'
  },
  {
    value: 'template-grid',
    label: 'Template + grid',
    hint: 'The same sheet with a 1" measuring grid inside the insert, numbered from the cut corner and repeated across the middle ("3,2" = 3" across, 2" down). Use it to measure exactly where the frame edge lands.',
    hintWithoutHolder: 'The same sheet with a 1" measuring grid inside the insert, numbered from the cut corner and repeated across the middle ("3,2" = 3" across, 2" down). Select a card holder above to include its viewable window.'
  },
  {
    value: 'grid',
    label: 'Measuring grid',
    hint: 'For a holder nobody has measured yet: a full sheet of 1" grid you trim with scissors until it slides in, then read the insert size off the numbers. Coordinates repeat across it, so even an offcut says where it came from, and every known holder size is drawn on it as an outline.'
  }
]

// Paper size selection, an optional print-fit warning, the PNG / print-ready PDF buttons, and
// the measuring sheets. Paper options are derived from PAPER_DIMENSIONS so adding a sheet
// there surfaces it here.
export const SignExportControls = ({
  paperSize,
  onPaperSizeChange,
  onExportPNG,
  onExportPDF,
  templateMode,
  onTemplateModeChange,
  onExportTemplateSheet,
  hasCardHolder,
  fitWarning
}) => {
  const mode = TEMPLATE_MODES.find(({ value }) => value === templateMode) || TEMPLATE_MODES[0]
  const hint = (!hasCardHolder && mode.hintWithoutHolder) || mode.hint

  return (
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
        <div className="template-mode-selector">
          <label>Measuring sheet:</label>
          <div className="template-mode-options">
            {TEMPLATE_MODES.map(({ value, label }) => (
              <label key={value} className={`template-mode-option ${templateMode === value ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="templateMode"
                  value={value}
                  checked={templateMode === value}
                  onChange={(e) => onTemplateModeChange(e.target.value)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <button type="button" onClick={onExportTemplateSheet} className="export-btn template-export__btn">
          Print measuring sheet (PDF)
        </button>
        <p className="template-export__hint">{hint}</p>
      </div>
    </div>
  )
}
