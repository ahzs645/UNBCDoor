import React from 'react'

export const ToggleButtons = ({
  signType,
  showAlumni,
  showAlumni2,
  showSecondOccupant,
  occupantName,
  occupantName2,
  showDesignations,
  onToggleAlumni,
  onToggleAlumni2,
  onToggleDesignations
}) => {
  const showToggles = signType === 'faculty' || signType === 'staff'
  const hasSecondOccupant = showSecondOccupant
  const primaryBadgeLabel = hasSecondOccupant
    ? `${occupantName || 'Occupant 1'} Alumni Badge`
    : 'Alumni Badge'
  const secondaryBadgeLabel = `${occupantName2 || 'Occupant 2'} Alumni Badge`
  
  if (!showToggles) return null
  
  return (
    <div className="toggle-buttons-container">
      <button
        type="button"
        className={`toggle-button ${showAlumni ? 'active' : ''}`}
        aria-pressed={showAlumni}
        onClick={onToggleAlumni}
      >
        {showAlumni ? `Hide ${primaryBadgeLabel}` : `Show ${primaryBadgeLabel}`}
      </button>

      {hasSecondOccupant && (
        <button
          type="button"
          className={`toggle-button ${showAlumni2 ? 'active' : ''}`}
          aria-pressed={showAlumni2}
          onClick={onToggleAlumni2}
        >
          {showAlumni2 ? `Hide ${secondaryBadgeLabel}` : `Show ${secondaryBadgeLabel}`}
        </button>
      )}

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
