import React, { useEffect, useRef, useState } from 'react'
import { SegmentedControl } from './SegmentedControl'
import { setUnits, useUnits } from '../hooks/useUnits'

const UNIT_OPTIONS = [
  { value: 'mm', label: 'Millimetres' },
  { value: 'in', label: 'Inches' }
]

// The gear beside the theme toggle: preferences for how the app reads, kept in this browser.
export const SettingsMenu = () => {
  const [open, setOpen] = useState(false)
  const units = useUnits()
  const root = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const handlePointer = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div className="settings-menu" ref={root}>
      <button
        type="button"
        className="theme-toggle-button"
        aria-label="Settings"
        title="Settings"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(value => !value)}
      >
        <span aria-hidden="true" className="theme-toggle-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="settings-menu__panel" role="dialog" aria-label="Settings">
          <span className="field-label" id="settings-units-label">Measurements</span>
          <SegmentedControl
            name="settingsUnits"
            className="segmented--fill"
            options={UNIT_OPTIONS}
            value={units}
            onChange={setUnits}
            aria-labelledby="settings-units-label"
          />
          <p className="field-hint">
            How sizes read across the app, and the units holder measurements start in. Saved in this browser.
          </p>
        </div>
      )}
    </div>
  )
}
