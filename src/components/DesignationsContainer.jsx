import React, { useState } from 'react'

const commonDesignations = [
  'PhD', 'MSc', 'MA', 'BSc', 'BA', 'MBA', 'MD', 'JD',
  'P.Eng', 'CPA', 'RN', 'LPN', 'RPBio', 'RPF', 'MCIP'
]

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
    <div id="designationsContainer">
      <label className="section-label">Professional Designations</label>
      
      <div className="designation-options">
        {commonDesignations.map(designation => (
          <div key={designation} className="designation-option">
            <input
              type="checkbox"
              id={`designation-${designation}`}
              checked={selectedDesignations.includes(designation)}
              onChange={() => handleDesignationToggle(designation)}
            />
            <label htmlFor={`designation-${designation}`}>{designation}</label>
          </div>
        ))}
      </div>
      
      <div className="custom-designation">
        <input
          type="text"
          placeholder="Add custom designation..."
          value={customDesignation}
          onChange={(e) => setCustomDesignation(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addCustomDesignation()}
        />
        <button type="button" onClick={addCustomDesignation}>Add</button>
      </div>
      
      {selectedDesignations.length > 0 && (
        <div className="selected-designations">
          <strong>Selected: </strong>
          {selectedDesignations.map(designation => (
            <span key={designation} className="designation-tag">
              {designation}
              <button type="button" onClick={() => removeDesignation(designation)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}