import React, { useState } from 'react'
import { INITIAL_SIGN_DATA } from '../sign/signData'

// Style options are stored with each sign so JSON imports retain their exact appearance.
// Every control is declared once here — label plus choices — and the GROUPS list below
// decides the ordering, headings, and which controls apply to the sign being edited.
const STYLE_CONTROLS = {
  headlineWeight: {
    label: 'Headline weight',
    options: [
      { value: 'regular', label: 'Regular' },
      { value: 'bold', label: 'Bold' },
      { value: 'black', label: 'Black' }
    ]
  },
  contentSize: {
    label: 'Content size',
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'large', label: 'Larger' },
      { value: 'largest', label: 'Largest' }
    ]
  },
  roomNameStyle: {
    label: 'Room name',
    options: [
      { value: 'standard', label: 'Bold' },
      { value: 'italic', label: 'Italic' }
    ]
  },
  bodyTextMode: {
    label: 'Body text sizing',
    options: [
      { value: 'hierarchy', label: 'Hierarchy' },
      { value: 'uniform', label: 'Uniform' }
    ]
  },
  positionSize: {
    label: 'Position size',
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'large', label: 'Larger' }
    ]
  },
  contactSize: {
    label: 'Contact size',
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'large', label: 'Larger' }
    ]
  },
  textAlignment: {
    label: 'Text alignment',
    options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Centred' }
    ]
  },
  contentWidth: {
    label: 'Content width',
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'wide', label: 'Wide' }
    ]
  },
  contentSpacing: {
    label: 'Vertical spacing',
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'compact', label: 'Compact' }
    ]
  },
  positionLayout: {
    label: 'Position layout',
    options: [
      { value: 'stacked', label: 'Stacked' },
      { value: 'inline', label: 'One line' }
    ]
  },
  contactLayout: {
    label: 'Contact layout',
    options: [
      { value: 'stacked', label: 'Stacked' },
      { value: 'inline', label: 'One line' }
    ]
  },
  designationLayout: {
    label: 'Designations',
    options: [
      { value: 'inline', label: 'Beside name' },
      { value: 'below', label: 'Below name' }
    ]
  },
  twoPersonSpacing: {
    label: 'Two-person spacing',
    options: [
      { value: 'compact', label: 'Compact' },
      { value: 'relaxed', label: 'Relaxed' }
    ]
  },
  roomContactGrouping: {
    label: 'Multiple contacts',
    options: [
      { value: 'by-person', label: 'By person' },
      { value: 'by-field', label: 'By field' }
    ]
  },
  alumniCrestSize: {
    label: 'Alumni crest size',
    options: [
      { value: 'small', label: 'Small' },
      { value: 'standard', label: 'Standard' },
      { value: 'large', label: 'Large' },
      { value: 'maximum', label: 'Max' }
    ]
  },
  alumniCrestSpacing: {
    label: 'Text-to-crest spacing',
    options: [
      { value: 'auto', label: 'Auto' },
      { value: 'tight', label: 'Tight' },
      { value: 'standard', label: 'Standard' },
      { value: 'wide', label: 'Wide' },
      { value: 'maximum', label: 'Max' }
    ]
  },
  organizationLogo: {
    label: 'Organization logo',
    options: [
      { value: 'none', label: 'None' },
      { value: 'ctaan', label: 'CTAAN' }
    ]
  }
}

// A control with no `when` always applies. The rest depend on the sign type and on which
// optional pieces (alumni crest, second occupant, designations) are turned on.
const GROUPS = [
  {
    id: 'type',
    label: 'Type & size',
    controls: [
      'headlineWeight',
      'contentSize',
      { key: 'roomNameStyle', when: ({ isRoomType }) => isRoomType },
      { key: 'bodyTextMode', when: ({ isRoomType }) => !isRoomType },
      { key: 'positionSize', when: ({ isRoomType }) => !isRoomType },
      'contactSize'
    ]
  },
  {
    id: 'layout',
    label: 'Layout & spacing',
    controls: [
      'textAlignment',
      'contentWidth',
      'contentSpacing',
      { key: 'positionLayout', when: ({ isRoomType }) => !isRoomType },
      'contactLayout',
      { key: 'designationLayout', when: ({ isRoomType, hasDesignations }) => !isRoomType && hasDesignations },
      { key: 'twoPersonSpacing', when: ({ isRoomType, hasSecondOccupant }) => !isRoomType && hasSecondOccupant },
      { key: 'roomContactGrouping', when: ({ isRoomType, hasSecondOccupant }) => isRoomType && hasSecondOccupant }
    ]
  },
  {
    id: 'extras',
    label: 'Crest & logo',
    controls: [
      { key: 'alumniCrestSize', when: ({ isRoomType, hasAlumni }) => !isRoomType && hasAlumni },
      { key: 'alumniCrestSpacing', when: ({ isRoomType, hasAlumni }) => !isRoomType && hasAlumni },
      { key: 'organizationLogo', when: ({ isRoomType }) => isRoomType }
    ]
  }
]

const Chevron = () => (
  <svg className="sign-style-panel__chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const OptionControl = ({ name, value, onChange }) => {
  const { label, options } = STYLE_CONTROLS[name]
  const labelId = `style-control-${name}`

  return (
    <div className="style-control">
      <span className="style-control__label" id={labelId}>{label}</span>
      <div className="style-options" role="radiogroup" aria-labelledby={labelId}>
        {options.map(option => (
          <label key={option.value} className={`style-option ${value === option.value ? 'active' : ''}`}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(event) => onChange(event.target.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  )
}

export const SignStyleControls = ({
  signData,
  onUpdate,
  hasAlumni,
  hasSecondOccupant,
  hasDesignations,
  isRoomType
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const context = { hasAlumni, hasSecondOccupant, hasDesignations, isRoomType }
  // Signs saved before an option existed have no value for it, so fall back to the default
  // rather than reporting the missing key as a customisation.
  const valueOf = (key) => signData[key] ?? INITIAL_SIGN_DATA[key]

  const groups = GROUPS
    .map(group => ({
      ...group,
      keys: group.controls
        .map(control => (typeof control === 'string' ? { key: control } : control))
        .filter(control => !control.when || control.when(context))
        .map(control => control.key)
    }))
    .filter(group => group.keys.length > 0)

  // Only controls that apply to this sign count as changed — the rest have no visible effect.
  const changedKeys = groups
    .flatMap(group => group.keys)
    .filter(key => valueOf(key) !== INITIAL_SIGN_DATA[key])

  const resetStyles = () => {
    onUpdate(Object.fromEntries(changedKeys.map(key => [key, INITIAL_SIGN_DATA[key]])))
  }

  return (
    <section className="sign-style-panel">
      <div className="sign-style-panel__header">
        <button
          type="button"
          className="sign-style-panel__toggle"
          aria-expanded={isOpen}
          aria-controls="sign-style-panel-body"
          onClick={() => setIsOpen(open => !open)}
        >
          <Chevron />
          <span className="sign-style-panel__title">Appearance</span>
          <span className={`sign-style-panel__summary ${changedKeys.length > 0 ? 'sign-style-panel__summary--changed' : ''}`}>
            {changedKeys.length === 0
              ? 'Default styling'
              : `${changedKeys.length} change${changedKeys.length === 1 ? '' : 's'}`}
          </span>
        </button>
        {changedKeys.length > 0 && (
          <button type="button" className="sign-style-panel__reset" onClick={resetStyles}>
            Reset
          </button>
        )}
      </div>

      <div className="sign-style-panel__body" id="sign-style-panel-body" hidden={!isOpen}>
        {groups.map(group => (
          <div className="style-group" key={group.id}>
            <span className="style-group__label">{group.label}</span>
            <div className="style-group__controls">
              {group.keys.map(key => (
                <OptionControl
                  key={key}
                  name={key}
                  value={valueOf(key)}
                  onChange={(value) => onUpdate({ [key]: value })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
