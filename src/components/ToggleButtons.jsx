import React from 'react'

export const ToggleButtons = ({ signType, showAlumni, showDesignations, onToggleAlumni, onToggleDesignations }) => {
  const showToggles = signType === 'faculty' || signType === 'staff'
  
  if (!showToggles) return null
  
  return (
    <div className="toggle-buttons-container">
      <button
        type="button"
        className={`toggle-button ${showAlumni ? 'active' : ''}`}
        aria-pressed={showAlumni}
        onClick={onToggleAlumni}
      >
        {showAlumni ? 'Hide Alumni Badge' : 'Show Alumni Badge'}
      </button>

      <button
        type="button"
        className={`toggle-button ${showDesignations ? 'active' : ''}`}
        aria-pressed={showDesignations}
        onClick={onToggleDesignations}
      >
        {showDesignations ? 'Disable Designations' : 'Enable Designations'}
      </button>
    </div>
  )
}