import React from 'react'
import { LINE_COLORS } from './HolderMockup'

// The colour of the line under the room number: the plate colours in use on campus as swatches,
// plus any other colour from the system picker.
export const LineColorPicker = ({ name, value, onChange, label = 'Line colour' }) => {
  const current = (value || '').toLowerCase()
  const isPreset = LINE_COLORS.some(color => color.value === current)

  return (
    <div className="line-color-picker" role="radiogroup" aria-label={label}>
      <span className="line-color-picker__label" aria-hidden="true">{label}</span>
      {LINE_COLORS.map(color => (
        <label
          key={color.value}
          className={`line-color-picker__swatch ${current === color.value ? 'is-active' : ''}`}
          title={color.label}
        >
          <input
            type="radio"
            name={name}
            value={color.value}
            checked={current === color.value}
            onChange={() => onChange(color.value)}
          />
          <span className="line-color-picker__chip" style={{ background: color.value }} aria-hidden="true" />
          <span className="line-color-picker__name">{color.label}</span>
        </label>
      ))}
      <label
        className={`line-color-picker__swatch line-color-picker__swatch--custom ${isPreset ? '' : 'is-active'}`}
        title="Pick any colour"
      >
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(current) ? current : '#c4a24a'}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
          aria-label="Custom line colour"
        />
        <span className="line-color-picker__name">Custom</span>
      </label>
    </div>
  )
}
