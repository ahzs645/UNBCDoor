import React from 'react'

export const CardHolderSelector = ({ cardHolders, selectedType, onUpdate }) => {
  const handleChange = (e) => {
    onUpdate(e.target.value)
  }

  const selectedHolder = selectedType ? cardHolders[selectedType] : null

  return (
    <div className="form-group">
      <label htmlFor="cardHolderType">Card Holder Type</label>
      <select 
        id="cardHolderType" 
        name="cardHolderType"
        value={selectedType}
        onChange={handleChange}
      >
        <option value="">Select Card Holder Type</option>
        {Object.entries(cardHolders).map(([key, holder]) => (
          <option key={key} value={key}>
            {key} - {holder.name}
          </option>
        ))}
      </select>
      
      {selectedHolder && (
        <div className="card-holder-info" style={{ display: 'block', marginTop: '8px', fontSize: '0.9em', color: '#666' }}>
          <strong>{selectedHolder.name}</strong><br />
          {selectedHolder.description}<br />
          Viewable Area: {selectedHolder.viewableArea.width}" × {selectedHolder.viewableArea.height}"
        </div>
      )}
    </div>
  )
}