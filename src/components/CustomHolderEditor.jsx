import React, { useState } from 'react'
import { SegmentedControl } from './SegmentedControl'
import { LineColorPicker } from './LineColorPicker'
import { DEFAULT_LINE_COLOR, PLATE_STYLES, resolveHolderPlate } from './HolderMockup'
import { MAX_HOLDER_NAME, MAX_ROOM_NUMBER, validateCustomHolder } from '../sign/customHolders'
import { MM_PER_INCH } from '../sign/templateGeometry'

const EDGES = [
  { key: 'top', label: 'Top' },
  { key: 'bottom', label: 'Bottom' },
  { key: 'left', label: 'Left' },
  { key: 'right', label: 'Right' }
]

const UNIT_OPTIONS = [
  { value: 'in', label: 'Inches' },
  { value: 'mm', label: 'mm' }
]

const PLATE_OPTIONS = Object.entries(PLATE_STYLES).map(([value, { label }]) => ({ value, label }))

// Fields hold what was typed (so "6." mid-edit isn't rewritten); inches only on save.
const toText = (inches, units) => {
  const value = units === 'mm' ? inches * MM_PER_INCH : inches
  return Number(value.toFixed(units === 'mm' ? 1 : 3)).toString()
}

const toInches = (text, units) => {
  const value = Number.parseFloat(text)
  if (!Number.isFinite(value)) return NaN
  return units === 'mm' ? value / MM_PER_INCH : value
}

const NumberInput = ({ id, label, value, units, onChange }) => (
  <div className="holder-editor__field">
    <label htmlFor={id}>{label}</label>
    <div className="holder-editor__number">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        step={units === 'mm' ? '0.5' : '0.01'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span aria-hidden="true">{units === 'mm' ? 'mm' : 'in'}</span>
    </div>
  </div>
)

// Create or edit a holder preset that lives in this browser. `initial` is the holder to start
// from (a copy of the selected one when making a new holder); `editingName` is set when editing.
export const CustomHolderEditor = ({ initial, editingName, takenNames, onSave, onCancel }) => {
  const [units, setUnits] = useState('in')
  const [name, setName] = useState(editingName || '')
  const [insert, setInsert] = useState({
    width: toText(initial.insertSize.width, 'in'),
    height: toText(initial.insertSize.height, 'in')
  })
  const [offset, setOffset] = useState(Object.fromEntries(
    EDGES.map(({ key }) => [key, toText(initial.viewableOffset[key] || 0, 'in')])
  ))
  const initialPlate = resolveHolderPlate(initial)
  const [plateStyle, setPlateStyle] = useState(initialPlate.style)
  const [lineColor, setLineColor] = useState(initialPlate.lineColor || DEFAULT_LINE_COLOR)
  const [roomNumber, setRoomNumber] = useState(initial.roomNumber || '')
  const [notes, setNotes] = useState(editingName ? initial.notes || '' : '')
  const [showProblems, setShowProblems] = useState(false)

  const switchUnits = (next) => {
    if (next === units) return
    const convert = (text) => {
      const inches = toInches(text, units)
      return Number.isFinite(inches) ? toText(inches, next) : text
    }
    setInsert(prev => ({ width: convert(prev.width), height: convert(prev.height) }))
    setOffset(prev => Object.fromEntries(Object.entries(prev).map(([edge, text]) => [edge, convert(text)])))
    setUnits(next)
  }

  const holder = {
    name,
    insertSize: { width: toInches(insert.width, units), height: toInches(insert.height, units) },
    viewableOffset: Object.fromEntries(Object.entries(offset).map(([edge, text]) => [edge, toInches(text, units)])),
    plateStyle,
    plateLineColor: lineColor,
    roomNumber: roomNumber.trim(),
    notes: notes.trim()
  }
  const problems = validateCustomHolder(holder, takenNames)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (problems.length) {
      setShowProblems(true)
      return
    }
    onSave(name.trim(), holder)
  }

  return (
    <form className="holder-editor" onSubmit={handleSubmit} aria-labelledby="holder-editor-title">
      <div className="holder-editor__head">
        <h3 id="holder-editor-title">{editingName ? 'Edit custom holder' : 'New custom holder'}</h3>
        <SegmentedControl
          name="holderEditorUnits"
          className="segmented--compact"
          options={UNIT_OPTIONS}
          value={units}
          onChange={switchUnits}
          aria-label="Units"
        />
      </div>
      <p className="holder-editor__intro">
        Saved in this browser only — it won't travel with share links or to other computers.
      </p>

      <div className="holder-editor__field">
        <label htmlFor="holder-editor-name">Name</label>
        <input
          id="holder-editor-name"
          type="text"
          value={name}
          maxLength={MAX_HOLDER_NAME}
          placeholder="e.g. Building 5 — Lab wing"
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />
      </div>

      <fieldset className="holder-editor__group">
        <legend>Insert (cut card)</legend>
        <div className="holder-editor__grid">
          <NumberInput id="holder-editor-width" label="Width" value={insert.width} units={units} onChange={(width) => setInsert(prev => ({ ...prev, width }))} />
          <NumberInput id="holder-editor-height" label="Height" value={insert.height} units={units} onChange={(height) => setInsert(prev => ({ ...prev, height }))} />
        </div>
      </fieldset>

      <fieldset className="holder-editor__group">
        <legend>Hidden by the frame</legend>
        <div className="holder-editor__grid">
          {EDGES.map(({ key, label }) => (
            <NumberInput
              key={key}
              id={`holder-editor-${key}`}
              label={label}
              value={offset[key]}
              units={units}
              onChange={(value) => setOffset(prev => ({ ...prev, [key]: value }))}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="holder-editor__group">
        <legend>Room plate</legend>
        <SegmentedControl
          name="holderEditorPlate"
          className="segmented--fill"
          options={PLATE_OPTIONS}
          value={plateStyle}
          onChange={setPlateStyle}
          aria-label="Room plate"
        />
        {plateStyle === 'line' && (
          <LineColorPicker name="holderEditorLineColor" value={lineColor} onChange={setLineColor} />
        )}
        <div className="holder-editor__field">
          <label htmlFor="holder-editor-room">Room no.</label>
          <input
            id="holder-editor-room"
            type="text"
            value={roomNumber}
            maxLength={MAX_ROOM_NUMBER}
            placeholder="Optional — the number on this plate"
            onChange={(event) => setRoomNumber(event.target.value)}
          />
        </div>
      </fieldset>

      <div className="holder-editor__field">
        <label htmlFor="holder-editor-notes">Notes</label>
        <input
          id="holder-editor-notes"
          type="text"
          value={notes}
          placeholder="Optional — where it's used, when it was measured"
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      {showProblems && problems.length > 0 && (
        <ul className="holder-editor__problems" role="alert">
          {problems.map(problem => <li key={problem}>{problem}</li>)}
        </ul>
      )}

      <div className="holder-editor__actions">
        <button type="button" className="export-btn export-btn--secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="export-btn">{editingName ? 'Save changes' : 'Save holder'}</button>
      </div>
    </form>
  )
}
