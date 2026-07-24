import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CustomSelect } from './CustomSelect'
import { PAPER_ORDER, PAPER_DIMENSIONS } from '../sign/signConstants'
import { resolveCardHolderGeometry } from '../sign/signGeometry'
import { MM_PER_INCH, formatDualSize } from '../sign/templateGeometry'
import {
  GRID_DETAIL_OPTIONS,
  SHEET_MODES,
  downloadMeasuringSheet,
  getSheetMode,
  measuringSheetPreviewUrl,
  printMeasuringSheet
} from '../sign/measuringSheets'

const CUSTOM_HOLDER = 'custom'

// A holder to start from when someone picks "Custom size" without having measured anything —
// the most common production insert, so the numbers are a sane starting point to edit.
const CUSTOM_DEFAULTS = {
  insert: { width: 6.97, height: 4.17 },
  overlap: { top: 0.2, bottom: 0.1, left: 0.15, right: 0.15 }
}

const EDGES = [
  { key: 'top', label: 'Top' },
  { key: 'bottom', label: 'Bottom' },
  { key: 'left', label: 'Left' },
  { key: 'right', label: 'Right' }
]

// Values are held in inches; the unit switch only changes how they're typed and shown.
const toDisplay = (inches, units) => {
  const value = units === 'mm' ? inches * MM_PER_INCH : inches
  return Number(value.toFixed(units === 'mm' ? 1 : 3)).toString()
}

const fromDisplay = (value, units) => {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return units === 'mm' ? parsed / MM_PER_INCH : parsed
}

const Segmented = ({ name, options, value, onChange }) => (
  <div className="template-mode-options">
    {options.map((option) => (
      <label
        key={option.value}
        className={`template-mode-option ${value === option.value ? 'active' : ''}`}
      >
        <input
          type="radio"
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={() => onChange(option.value)}
        />
        {option.label}
      </label>
    ))}
  </div>
)

const NumberField = ({ id, label, inches, units, onChange }) => (
  <div className="measuring-sheets__field">
    <label htmlFor={id}>{label}</label>
    <input
      id={id}
      type="number"
      min="0"
      step={units === 'mm' ? '0.5' : '0.01'}
      value={toDisplay(inches, units)}
      onChange={(event) => {
        const next = fromDisplay(event.target.value, units)
        if (next !== null) onChange(next)
      }}
    />
  </div>
)

// The configure-and-print page for the measuring sheets: pick a sheet, a holder (preset or
// measured by hand), a paper size and the grid options, watch the sheet redraw, then print it.
export const MeasuringSheetsPage = ({ cardHolders, initialHolderKey = '' }) => {
  const [mode, setMode] = useState('template')
  const [paperSize, setPaperSize] = useState('letter')
  const [holderKey, setHolderKey] = useState(initialHolderKey)
  const [units, setUnits] = useState('in')
  const [custom, setCustom] = useState(CUSTOM_DEFAULTS)
  const [subdivisions, setSubdivisions] = useState(4)
  const [showCoordinates, setShowCoordinates] = useState(true)
  const [showPresetOutlines, setShowPresetOutlines] = useState(true)
  const [previewUrl, setPreviewUrl] = useState('')
  const [message, setMessage] = useState('')
  const previewUrlRef = useRef('')

  const sheetMode = getSheetMode(mode)
  const isCustom = holderKey === CUSTOM_HOLDER

  const holderOptions = [
    ...Object.entries(cardHolders).map(([key, holder]) => ({ value: key, label: `${key} — ${holder.name}` })),
    { value: CUSTOM_HOLDER, label: 'Custom size — measured by hand' }
  ]

  // One geometry for the sheet builder, whichever way the holder was chosen.
  const geometry = useMemo(() => {
    if (isCustom) {
      const insertSize = { ...custom.insert }
      const viewableOffset = { ...custom.overlap }
      return {
        insertSize,
        viewableSize: {
          width: Math.max(insertSize.width - viewableOffset.left - viewableOffset.right, 0),
          height: Math.max(insertSize.height - viewableOffset.top - viewableOffset.bottom, 0)
        },
        viewableOffset,
        holderName: 'Custom size (measured by hand)',
        holderNotes: 'Measured by hand on the configure page — not a saved preset.'
      }
    }

    const holder = cardHolders[holderKey] || null
    const resolved = resolveCardHolderGeometry(holder)
    return {
      insertSize: resolved.insertSize,
      viewableSize: resolved.viewableSize,
      viewableOffset: resolved.viewableOffset,
      holderName: holder?.name,
      holderNotes: holder?.notes
    }
  }, [cardHolders, custom, holderKey, isCustom])

  const config = useMemo(() => ({
    mode,
    paperSize,
    cardHolders,
    holderKey: holderKey || '',
    holderName: geometry.holderName,
    holderNotes: geometry.holderNotes,
    insertSize: geometry.insertSize,
    viewableSize: geometry.viewableSize,
    viewableOffset: geometry.viewableOffset,
    subdivisions,
    showCoordinates,
    showPresetOutlines
  }), [cardHolders, geometry, holderKey, mode, paperSize, showCoordinates, showPresetOutlines, subdivisions])

  // Redraw the preview a beat after the last change, so dragging a number field doesn't
  // rebuild the PDF on every keystroke. Each new blob replaces (and revokes) the last.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const url = measuringSheetPreviewUrl(config)
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = url
        setPreviewUrl(url)
        setMessage('')
      } catch (error) {
        console.error('Could not build the measuring sheet:', error)
        setMessage('Could not build this sheet — check the measurements above.')
      }
    }, 150)

    return () => window.clearTimeout(timer)
  }, [config])

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  const handlePrint = () => {
    const opened = printMeasuringSheet(config)
    setMessage(opened
      ? 'Opened the print dialog in a new tab. Set scaling to “Actual size” (100%).'
      : 'Your browser blocked the print tab, so the PDF was downloaded instead — print it at 100%.')
  }

  const presetSnippet = `'My Holder': {
  name: 'My Holder',
  description: 'Measured on <date> in <building>.',
  insertSize: { width: ${geometry.insertSize.width.toFixed(2)}, height: ${geometry.insertSize.height.toFixed(2)} },
  viewableSize: { width: ${geometry.viewableSize.width.toFixed(2)}, height: ${geometry.viewableSize.height.toFixed(2)} },
  viewableOffset: { top: ${geometry.viewableOffset.top}, bottom: ${geometry.viewableOffset.bottom}, left: ${geometry.viewableOffset.left}, right: ${geometry.viewableOffset.right} },
  notes: 'Measured by hand.'
}`

  return (
    <div className="measuring-sheets">
      <div className="measuring-sheets__config">
        <div className="measuring-sheets__group">
          <label id="sheet-mode-label">Sheet</label>
          <Segmented
            name="sheetMode"
            options={SHEET_MODES}
            value={mode}
            onChange={setMode}
          />
          <p className="measuring-sheets__hint">{sheetMode.summary}</p>
        </div>

        {sheetMode.usesHolder && (
          <div className="measuring-sheets__group">
            <label htmlFor="sheetHolder">Card holder</label>
            <CustomSelect
              id="sheetHolder"
              name="sheetHolder"
              options={holderOptions}
              value={holderKey}
              placeholder="No holder — bleed, cut line and safe area only"
              onChange={setHolderKey}
            />

            {isCustom && (
              <>
                <div className="measuring-sheets__units">
                  <span>Enter measurements in</span>
                  <Segmented
                    name="sheetUnits"
                    options={[{ value: 'in', label: 'Inches' }, { value: 'mm', label: 'Millimetres' }]}
                    value={units}
                    onChange={setUnits}
                  />
                </div>

                <div className="measuring-sheets__fields">
                  <NumberField
                    id="insertWidth"
                    label="Insert width"
                    inches={custom.insert.width}
                    units={units}
                    onChange={(width) => setCustom((prev) => ({ ...prev, insert: { ...prev.insert, width } }))}
                  />
                  <NumberField
                    id="insertHeight"
                    label="Insert height"
                    inches={custom.insert.height}
                    units={units}
                    onChange={(height) => setCustom((prev) => ({ ...prev, insert: { ...prev.insert, height } }))}
                  />
                </div>

                <p className="measuring-sheets__hint">
                  Frame overlap — how much of each edge the holder covers. Leave these at zero
                  if you have only measured the insert.
                </p>
                <div className="measuring-sheets__fields">
                  {EDGES.map(({ key, label }) => (
                    <NumberField
                      key={key}
                      id={`overlap-${key}`}
                      label={label}
                      inches={custom.overlap[key]}
                      units={units}
                      onChange={(value) => setCustom((prev) => ({ ...prev, overlap: { ...prev.overlap, [key]: value } }))}
                    />
                  ))}
                </div>
              </>
            )}

            <dl className="measuring-sheets__summary">
              <div>
                <dt>Insert / cut size</dt>
                <dd>{formatDualSize(geometry.insertSize)}</dd>
              </div>
              {/* Without a holder there is no window — the sheet falls back to the safe area,
                  so quoting a "viewable window" the same size as the insert would be a lie. */}
              {holderKey && (
                <div>
                  <dt>Viewable window</dt>
                  <dd>{formatDualSize(geometry.viewableSize)}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        <div className="measuring-sheets__group">
          <label htmlFor="sheetPaper">Paper size</label>
          <Segmented
            name="sheetPaper"
            options={PAPER_ORDER.map((key) => ({ value: key, label: PAPER_DIMENSIONS[key].label }))}
            value={paperSize}
            onChange={setPaperSize}
          />
        </div>

        {sheetMode.usesGrid && (
          <div className="measuring-sheets__group">
            <label>Grid</label>
            <Segmented
              name="sheetGrid"
              options={GRID_DETAIL_OPTIONS}
              value={subdivisions}
              onChange={setSubdivisions}
            />

            <label className="switch measuring-sheets__switch">
              <input
                type="checkbox"
                checked={showCoordinates}
                onChange={(event) => setShowCoordinates(event.target.checked)}
              />
              <span className="switch__track" aria-hidden="true" />
              <span className="switch__text">Repeat coordinates across the grid</span>
            </label>

            {mode === 'grid' && (
              <label className="switch measuring-sheets__switch">
                <input
                  type="checkbox"
                  checked={showPresetOutlines}
                  onChange={(event) => setShowPresetOutlines(event.target.checked)}
                />
                <span className="switch__track" aria-hidden="true" />
                <span className="switch__text">Draw the known holder sizes as outlines</span>
              </label>
            )}
          </div>
        )}

        <div className="measuring-sheets__actions">
          <button type="button" className="export-btn" onClick={handlePrint}>
            Print sheet
          </button>
          <button type="button" className="export-btn template-export__btn" onClick={() => downloadMeasuringSheet(config)}>
            Download PDF
          </button>
        </div>

        <p className="measuring-sheets__warning">
          Print at 100% — “Actual size”, never “Fit to page”. Every sheet carries a scale check;
          confirm it with a ruler before you measure or cut anything.
        </p>

        {message && <p className="measuring-sheets__message" role="status">{message}</p>}

        {isCustom && (
          <details className="measuring-sheets__preset">
            <summary>Save these measurements as a preset</summary>
            <p>Add this entry to <code>src/data/cardHolders.js</code> so the holder is one click away next time.</p>
            <pre>{presetSnippet}</pre>
          </details>
        )}
      </div>

      <div className="measuring-sheets__preview">
        {/* The viewer parameters hide the built-in PDF chrome and fit the sheet to the panel. */}
        {previewUrl ? (
          <object
            data={`${previewUrl}#toolbar=0&navpanes=0&view=FitH&zoom=page-fit`}
            type="application/pdf"
            aria-label="Measuring sheet preview"
          >
            {/* Shown instead of the preview when the browser has no built-in PDF viewer. */}
            <p className="measuring-sheets__hint">
              This browser cannot preview PDFs. <a href={previewUrl} download>Open the sheet</a>{' '}
              or use Download PDF.
            </p>
          </object>
        ) : (
          <p className="measuring-sheets__hint">Building the sheet…</p>
        )}
      </div>
    </div>
  )
}
