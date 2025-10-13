import React from 'react'

export const CardHolderSelector = ({ cardHolders, selectedType, onUpdate }) => {
  const handleChange = (e) => {
    onUpdate(e.target.value)
  }

  const formatInches = (value) => {
    if (Number.isInteger(value)) {
      return value.toString()
    }

    return value.toFixed(2).replace(/\.00$/, '').replace(/0$/, '')
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
        <div className="card-holder-info">
          <div className="card-holder-info__header">
            <strong>{selectedHolder.name}</strong>
            <span className="card-holder-info__note">{selectedHolder.description}</span>
          </div>

          <dl className="card-holder-info__measurements">
            <div className="card-holder-info__measurement">
              <dt>Insert size</dt>
              <dd>
                {formatInches(selectedHolder.insertSize.width)}" × {formatInches(selectedHolder.insertSize.height)}"
              </dd>
            </div>
            <div className="card-holder-info__measurement">
              <dt>Viewable window</dt>
              <dd>
                {formatInches(selectedHolder.viewableSize.width)}" × {formatInches(selectedHolder.viewableSize.height)}"
              </dd>
            </div>
          </dl>

          {selectedHolder.notes && (
            <p className="card-holder-info__notes">{selectedHolder.notes}</p>
          )}
        </div>
      )}
    </div>
  )
}