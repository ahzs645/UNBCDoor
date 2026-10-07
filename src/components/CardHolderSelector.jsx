import React, { useState } from 'react'
import { CustomSelect } from './CustomSelect'
import { CustomHolderEditor } from './CustomHolderEditor'
import { PLATE_STYLES, LINE_COLORS, resolveHolderPlate } from './HolderMockup'
import { DEFAULT_INSERT_SIZE } from '../sign/signConstants'

const NEW_HOLDER = '__new-custom-holder__'

const plateDescription = (holder) => {
  const { style, lineColor } = resolveHolderPlate(holder)
  const label = PLATE_STYLES[style].label.toLowerCase()
  const named = lineColor && LINE_COLORS.find(color => color.value === lineColor.toLowerCase())
  return [
    label,
    style === 'line' && lineColor ? `${named ? named.label.toLowerCase() : lineColor} line` : null,
    holder?.roomNumber ? `room ${holder.roomNumber}` : null
  ].filter(Boolean).join(', ')
}

// Picks the physical holder the insert goes into. Its sizes are listed by the export panel
// (alongside the print size), so this only adds the holder's own description and notes — and
// the editor for holders saved in this browser.
export const CardHolderSelector = ({
  cardHolders,
  builtInHolderNames = [],
  selectedType,
  onUpdate,
  onSaveCustom,
  onDeleteCustom
}) => {
  // null, { mode: 'new' } or { mode: 'edit', name }
  const [editor, setEditor] = useState(null)
  const canSaveCustom = Boolean(onSaveCustom)

  const options = [
    { value: '', label: 'No holder — bleed, cut line and safe area only' },
    ...Object.entries(cardHolders).map(([key, holder]) => ({
      value: key,
      label: `${key} — ${holder.name}`
    })),
    ...(canSaveCustom ? [{ value: NEW_HOLDER, label: '+ New custom holder…' }] : [])
  ]

  const selectedHolder = selectedType ? cardHolders[selectedType] : null

  const handleChange = (value) => {
    if (value === NEW_HOLDER) {
      setEditor({ mode: 'new' })
      return
    }
    setEditor(null)
    onUpdate(value)
  }

  if (editor) {
    const editingName = editor.mode === 'edit' ? editor.name : null
    const base = editingName
      ? cardHolders[editingName]
      : selectedHolder || {
        insertSize: DEFAULT_INSERT_SIZE,
        viewableOffset: { top: 0.2, bottom: 0.1, left: 0.15, right: 0.15 }
      }
    return (
      <div className="form-group card-holder-field">
        <CustomHolderEditor
          initial={base}
          editingName={editingName}
          takenNames={Object.keys(cardHolders).filter(name => name !== editingName)}
          onCancel={() => setEditor(null)}
          onSave={(name, holder) => {
            onSaveCustom(name, holder, editingName)
            setEditor(null)
            onUpdate(name)
          }}
        />
      </div>
    )
  }

  const isCustom = Boolean(selectedHolder?.custom) && !builtInHolderNames.includes(selectedType)

  return (
    <div className="form-group card-holder-field">
      <label htmlFor="cardHolderType">Card holder</label>
      <CustomSelect
        id="cardHolderType"
        name="cardHolderType"
        options={options}
        value={selectedType || ''}
        onChange={handleChange}
      />
      {selectedHolder && (selectedHolder.description || selectedHolder.notes) && (
        <p className="field-hint">
          {[selectedHolder.description, selectedHolder.notes].filter(Boolean).join(' ')}
        </p>
      )}
      {selectedHolder && (
        <p className="field-hint">
          Room plate: <strong>{plateDescription(selectedHolder)}</strong> (see Preview → On the door).
        </p>
      )}
      {canSaveCustom && (
        <div className="card-holder-actions">
          {isCustom ? (
            <>
              <button type="button" className="text-btn" onClick={() => setEditor({ mode: 'edit', name: selectedType })}>
                Edit this holder
              </button>
              <button
                type="button"
                className="text-btn text-btn--danger"
                onClick={() => {
                  if (!window.confirm(`Delete the custom holder “${selectedType}” from this browser?`)) return
                  onDeleteCustom(selectedType)
                  onUpdate('')
                }}
              >
                Delete
              </button>
            </>
          ) : (
            <button type="button" className="text-btn" onClick={() => setEditor({ mode: 'new' })}>
              {selectedHolder ? 'Save a custom copy of this holder…' : '+ New custom holder…'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
