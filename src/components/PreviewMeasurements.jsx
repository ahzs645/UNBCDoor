import React from 'react'

// Print-with-bleed readout below the preview. The holder name, insert and viewable
// sizes already appear in the card-holder info box above, so they're omitted here to
// avoid repeating the same information twice in the panel.
export const PreviewMeasurements = ({ measurementSummary }) => {
  const printItems = measurementSummary.filter(({ label }) => label === 'Print (with bleed)')

  if (printItems.length === 0) {
    return null
  }

  return (
    <div className="preview-measurements">
      <div className="preview-measurements__list">
        {printItems.map(({ label, value }) => (
          <div key={label} className="preview-measurements__item">
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
