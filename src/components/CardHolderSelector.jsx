import React from 'react'
import { CustomSelect } from './CustomSelect'

// Picks the physical holder the insert goes into. Its sizes are listed by the export panel
// (alongside the print size), so this only adds the holder's own description and notes.
export const CardHolderSelector = ({ cardHolders, selectedType, onUpdate }) => {
  const options = [
    { value: '', label: 'No holder — bleed, cut line and safe area only' },
    ...Object.entries(cardHolders).map(([key, holder]) => ({
      value: key,
      label: `${key} — ${holder.name}`
    }))
  ]

  const selectedHolder = selectedType ? cardHolders[selectedType] : null

  return (
    <div className="form-group card-holder-field">
      <label htmlFor="cardHolderType">Card holder</label>
      <CustomSelect
        id="cardHolderType"
        name="cardHolderType"
        options={options}
        value={selectedType || ''}
        onChange={onUpdate}
      />
      {selectedHolder && (selectedHolder.description || selectedHolder.notes) && (
        <p className="field-hint">
          {[selectedHolder.description, selectedHolder.notes].filter(Boolean).join(' ')}
        </p>
      )}
    </div>
  )
}
