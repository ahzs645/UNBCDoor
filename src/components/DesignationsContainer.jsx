import React, { useState } from 'react'

const commonDesignations = [
  'PhD', 'MSc', 'MA', 'BSc', 'BA', 'MBA', 'MD', 'JD',
  'P.Eng', 'CPA', 'RN', 'LPN', 'RPBio', 'RPF', 'MCIP'
]

// Designations print in the order they were picked, so the chosen ones are listed separately
// in that order — the chips above only toggle membership.
export const DesignationsContainer = ({ selectedDesignations = [], onUpdate }) => {
  const [customDesignation, setCustomDesignation] = useState('')

  const handleDesignationToggle = (designation) => {
    const updated = selectedDesignations.includes(designation)
      ? selectedDesignations.filter(d => d !== designation)
      : [...selectedDesignations, designation]
    onUpdate(updated)
  }

  const addCustomDesignation = () => {
    if (customDesignation.trim() && !selectedDesignations.includes(customDesignation.trim())) {
      onUpdate([...selectedDesignations, customDesignation.trim()])
      setCustomDesignation('')
    }
  }

  const removeDesignation = (designation) => {
    onUpdate(selectedDesignations.filter(d => d !== designation))
  }

  return (
    <div id="designationsContainer" className="designations">
      <div className="designation-options" role="group" aria-label="Common designations">
        {commonDesignations.map(designation => {
          const checked = selectedDesignations.includes(designation)
          return (
            <label key={designation} className={`designation-chip ${checked ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => handleDesignationToggle(designation)}
              />
              {designation}
            </label>
          )
        })}
      </div>

      <div className="custom-designation">
        <input
          type="text"
          aria-label="Custom designation"
          placeholder="Another designation…"
          value={customDesignation}
          onChange={(e) => setCustomDesignation(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustomDesignation()
            }
          }}
        />
        <button type="button" onClick={addCustomDesignation} disabled={!customDesignation.trim()}>
          Add
        </button>
      </div>

      {selectedDesignations.length > 0 && (
        <div className="selected-designations">
          <span className="selected-designations__label">On the sign, in order</span>
          <ul className="selected-designations__list">
            {selectedDesignations.map(designation => (
              <li key={designation} className="designation-tag">
                {designation}
                <button
                  type="button"
                  onClick={() => removeDesignation(designation)}
                  aria-label={`Remove ${designation}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
