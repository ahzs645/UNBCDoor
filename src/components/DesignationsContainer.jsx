import React, { useState } from 'react'

const commonDesignations = [
  'PhD', 'MSc', 'MA', 'BSc', 'BA', 'MBA', 'MD', 'JD',
  'P.Eng', 'CPA', 'RN', 'LPN', 'RPBio', 'RPF', 'MCIP'
]

// Designations print in the order they were picked, so the chosen ones are listed separately
// in that order — the chips above only toggle membership. That list can be reordered with the
// arrow buttons or by dragging a tag onto another.
export const DesignationsContainer = ({ selectedDesignations = [], onUpdate }) => {
  const [customDesignation, setCustomDesignation] = useState('')
  const [dragIndex, setDragIndex] = useState(null)
  const [dropIndex, setDropIndex] = useState(null)

  const moveDesignation = (from, to) => {
    if (to < 0 || to >= selectedDesignations.length || from === to) return
    const updated = [...selectedDesignations]
    const [item] = updated.splice(from, 1)
    updated.splice(to, 0, item)
    onUpdate(updated)
  }

  const endDrag = () => {
    setDragIndex(null)
    setDropIndex(null)
  }

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
          <span className="selected-designations__label">On the sign, in order — drag or use ‹ › to reorder</span>
          <ul className="selected-designations__list">
            {selectedDesignations.map((designation, index) => (
              <li
                key={designation}
                className={[
                  'designation-tag',
                  dragIndex === index ? 'dragging' : '',
                  dropIndex === index && dragIndex !== index ? 'drop-target' : ''
                ].filter(Boolean).join(' ')}
                draggable={selectedDesignations.length > 1}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', designation)
                  setDragIndex(index)
                }}
                onDragOver={(e) => {
                  if (dragIndex === null) return
                  e.preventDefault()
                  setDropIndex(index)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (dragIndex !== null) moveDesignation(dragIndex, index)
                  endDrag()
                }}
                onDragEnd={endDrag}
              >
                {selectedDesignations.length > 1 && (
                  <button
                    type="button"
                    className="designation-tag__move"
                    onClick={() => moveDesignation(index, index - 1)}
                    disabled={index === 0}
                    aria-label={`Move ${designation} earlier`}
                    title="Move earlier"
                  >
                    ‹
                  </button>
                )}
                {designation}
                {selectedDesignations.length > 1 && (
                  <button
                    type="button"
                    className="designation-tag__move"
                    onClick={() => moveDesignation(index, index + 1)}
                    disabled={index === selectedDesignations.length - 1}
                    aria-label={`Move ${designation} later`}
                    title="Move later"
                  >
                    ›
                  </button>
                )}
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
