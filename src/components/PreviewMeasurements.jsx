import React from 'react'

// Readout of the print/trim/viewable dimensions below the preview, plus the holder name.
export const PreviewMeasurements = ({ selectedCardHolder, measurementSummary }) => (
  <div className="preview-measurements">
    {selectedCardHolder && (
      <div className="preview-measurements__title">{selectedCardHolder.name}</div>
    )}
    <div className="preview-measurements__list">
      {measurementSummary.map(({ label, value }) => (
        <div key={label} className="preview-measurements__item">
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  </div>
)
