import React, { useId } from 'react'

// A small "i" that shows its text on hover or keyboard focus, for explanations that would
// otherwise sit under a control as a paragraph.
export const InfoTip = ({ children, label = 'More information' }) => {
  const id = useId()
  return (
    <span className="info-tip">
      <button type="button" className="info-tip__button" aria-label={label} aria-describedby={id}>i</button>
      <span className="info-tip__text" role="tooltip" id={id}>{children}</span>
    </span>
  )
}
