import React, { useState } from 'react'
import { INITIAL_SIGN_DATA } from '../sign/signData'
import { ROOM_SIGN_TYPES } from '../sign/signConstants'

// Style options are stored with each sign so JSON imports retain their exact appearance.
//
// A control is only offered when the sign actually contains the thing it restyles: no point
// offering a contact layout on a sign with a single phone number, or a position size on a
// room door. `describeSign` reduces the artwork content to the facts the `when` predicates
// need, so the panel and the artwork always agree on what is on the card.

const POSITION_SEPARATOR = /[\n\r·•|;]/

const describeSign = (content) => {
  const isRoom = ROOM_SIGN_TYPES.includes(content.signType)

  const primaryContacts = [
    content.showEmail && content.email,
    content.showPhone && content.phone,
    !isRoom && content.showCellPhone && content.cellPhone
  ].filter(Boolean)
  const secondaryContacts = content.showSecondOccupant
    ? [
      content.showEmail2 && content.email2,
      content.showPhone2 && content.phone2,
      !isRoom && content.showCellPhone2 && content.cellPhone2
    ].filter(Boolean)
    : []

  const hasSecondPerson = !isRoom && Boolean(content.showSecondOccupant && content.name2)
  const hasPosition = Boolean(content.position || (hasSecondPerson && content.position2))
  const hasTagline = Boolean(content.tagline || (hasSecondPerson && content.tagline2))
  const secondRoomEntry = isRoom && Boolean(content.showSecondOccupant)

  return {
    isRoom,
    hasAlumni: Boolean(content.showAlumni || content.showAlumni2),
    hasCredentials: Boolean(content.credentials),
    hasSecondPerson,
    hasPosition,
    hasTagline,
    // Splitting a position on separators only changes the sign when there is one to split on.
    hasSplitPosition: POSITION_SEPARATOR.test(content.position || '')
      || (hasSecondPerson && POSITION_SEPARATOR.test(content.position2 || '')),
    // The artwork pins two-person type sizes, so the size presets only bite on a solo sign.
    isCompactTwoPerson: hasSecondPerson && content.twoPersonSpacing !== 'relaxed',
    hasContacts: primaryContacts.length + secondaryContacts.length > 0,
    // Joining contact lines onto one line needs at least two of them in the same block.
    hasMultipleContacts: Math.max(primaryContacts.length, secondaryContacts.length) > 1,
    // Grouping by field only applies when a second *contact* — not a second room — shares the card.
    hasSecondRoomContact: secondRoomEntry && content.secondaryEntryType === 'contact',
    // Spacing and alignment need something below the headline to move.
    hasBodyContent: isRoom
      ? Boolean(content.contactName || primaryContacts.length || secondRoomEntry
        || content.organizationLogo === 'ctaan')
      : Boolean(hasPosition || hasTagline || primaryContacts.length || hasSecondPerson),
    // An italic room name is drawn at a fixed weight, so the weight presets do nothing.
    usesHeadlineWeight: !isRoom || content.roomNameStyle !== 'italic'
  }
}

const STYLE_CONTROLS = {
  headlineWeight: {
    label: 'Headline weight',
    when: (sign) => sign.usesHeadlineWeight,
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
    when: (sign) => sign.isRoom,
    options: [
      { value: 'standard', label: 'Bold' },
      { value: 'italic', label: 'Italic' }
    ]
  },
  // One control over two stored fields: "Match contacts" is the uniform body-text mode, which
  // overrides the position size outright. Splitting them left two knobs where one silently
  // cancelled the other.
  positionSize: {
    label: 'Position size',
    when: (sign) => !sign.isRoom && (sign.hasPosition || sign.hasTagline),
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'large', label: 'Larger' },
      { value: 'uniform', label: 'Match contacts' }
    ],
    read: (data) => (data.bodyTextMode === 'uniform' ? 'uniform' : data.positionSize),
    write: (value) => (value === 'uniform'
      ? { bodyTextMode: 'uniform' }
      : { bodyTextMode: 'hierarchy', positionSize: value })
  },
  contactSize: {
    label: 'Contact size',
    when: (sign) => sign.hasContacts,
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
    when: (sign) => sign.hasBodyContent,
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'compact', label: 'Compact' }
    ]
  },
  positionLayout: {
    label: 'Position layout',
    when: (sign) => !sign.isRoom && sign.hasSplitPosition,
    options: [
      { value: 'stacked', label: 'Stacked' },
      { value: 'inline', label: 'One line' }
    ]
  },
  contactLayout: {
    label: 'Contact layout',
    when: (sign) => sign.hasMultipleContacts,
    options: [
      { value: 'stacked', label: 'Stacked' },
      { value: 'inline', label: 'One line' }
    ]
  },
  designationLayout: {
    label: 'Designations',
    when: (sign) => !sign.isRoom && sign.hasCredentials,
    options: [
      { value: 'inline', label: 'Beside name' },
      { value: 'below', label: 'Below name' }
    ]
  },
  twoPersonSpacing: {
    label: 'Two-person spacing',
    when: (sign) => sign.hasSecondPerson,
    options: [
      { value: 'compact', label: 'Compact' },
      { value: 'relaxed', label: 'Relaxed' }
    ]
  },
  roomContactGrouping: {
    label: 'Multiple contacts',
    when: (sign) => sign.hasSecondRoomContact,
    options: [
      { value: 'by-person', label: 'By person' },
      { value: 'by-field', label: 'By field' }
    ]
  },
  alumniCrestSize: {
    label: 'Alumni crest size',
    when: (sign) => sign.hasAlumni,
    options: [
      { value: 'small', label: 'Small' },
      { value: 'standard', label: 'Standard' },
      { value: 'large', label: 'Large' },
      { value: 'maximum', label: 'Max' }
    ]
  },
  alumniCrestSpacing: {
    label: 'Text-to-crest spacing',
    when: (sign) => sign.hasAlumni,
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
    when: (sign) => sign.isRoom,
    options: [
      { value: 'none', label: 'None' },
      { value: 'ctaan', label: 'CTAAN' }
    ]
  }
}

const GROUPS = [
  { id: 'type', label: 'Type & size', keys: ['headlineWeight', 'contentSize', 'roomNameStyle', 'positionSize', 'contactSize'] },
  { id: 'layout', label: 'Layout & spacing', keys: ['textAlignment', 'contentWidth', 'contentSpacing', 'positionLayout', 'contactLayout', 'designationLayout', 'twoPersonSpacing', 'roomContactGrouping'] },
  { id: 'extras', label: 'Crest & logo', keys: ['alumniCrestSize', 'alumniCrestSpacing', 'organizationLogo'] }
]

// Signs saved before an option existed have no value for it, so fall back to the default
// rather than reporting the missing key as a customisation.
const readValue = (key, data) => {
  const { read } = STYLE_CONTROLS[key]
  const filled = { ...INITIAL_SIGN_DATA, ...data }
  return read ? read(filled) : filled[key]
}

const writeValue = (key, value) => {
  const { write } = STYLE_CONTROLS[key]
  return write ? write(value) : { [key]: value }
}

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

export const SignStyleControls = ({ signData, content, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false)

  const sign = describeSign(content)
  const applies = (key) => {
    const { when } = STYLE_CONTROLS[key]
    return !when || when(sign)
  }

  const groups = GROUPS
    .map(group => ({ ...group, keys: group.keys.filter(applies) }))
    .filter(group => group.keys.length > 0)

  // Only controls that apply to this sign count as changed — the rest have no visible effect.
  const changedKeys = groups
    .flatMap(group => group.keys)
    .filter(key => readValue(key, signData) !== readValue(key, INITIAL_SIGN_DATA))

  const resetStyles = () => {
    onUpdate(changedKeys.reduce(
      (patch, key) => ({ ...patch, ...writeValue(key, readValue(key, INITIAL_SIGN_DATA)) }),
      {}
    ))
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
                  value={readValue(key, signData)}
                  onChange={(value) => onUpdate(writeValue(key, value))}
                />
              ))}
            </div>
          </div>
        ))}
        <p className="sign-style-panel__hint">
          Only the options that change this sign are shown — more appear as you add content.
        </p>
      </div>
    </section>
  )
}
