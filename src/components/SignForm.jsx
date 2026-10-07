import React, { useState } from 'react'
import { DepartmentSelector } from '@unbc/logo'
import { CustomSelect } from './CustomSelect'
import { FormSection } from './FormSection'
import { SegmentedControl } from './SegmentedControl'
import { Switch } from './Switch'
import { RolesEditor } from './RolesEditor'
import { NAME_TITLES, emailFromName, getDefaultValues } from '../sign/signDefaults'

const ROOM_TYPES = ['lab', 'general-room', 'custodian-closet']

const SIGN_TYPE_OPTIONS = [
  { value: 'faculty', label: 'Faculty' },
  { value: 'staff', label: 'Staff' },
  { value: 'student', label: 'Student' },
  { value: 'lab', label: 'Lab' },
  { value: 'general-room', label: 'General room' },
  { value: 'custodian-closet', label: 'Custodian closet' }
]

const SECONDARY_ROOM_ENTRY_OPTIONS = [
  { value: 'contact', label: 'Another contact' },
  { value: 'room', label: 'Another room or lab' }
]

const ALUMNI_TYPES = ['faculty', 'staff']

const TAGLINE_HINT = 'Prints in italics. Wrap a line in *asterisks* to print it upright instead, and press Enter for a line break you want kept on the sign.'

// A name labels a tab by its first word after any title ("Dr. Jane Doe" → "Jane").
export const firstName = (name) => {
  const words = (name || '').trim().split(/\s+/).filter(Boolean)
  const first = words.find(word => !NAME_TITLES.test(word)) || ''
  return first.length > 18 ? `${first.slice(0, 17)}…` : first
}

const formatPhone = (value) => {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
}

const TextField = ({ id, label, hint, multiline, rows = 2, value, onChange, ...inputProps }) => (
  <div className="form-group">
    <label htmlFor={id}>{label}</label>
    {multiline ? (
      <textarea id={id} name={id} rows={rows} value={value} onChange={onChange} {...inputProps} />
    ) : (
      <input type="text" id={id} name={id} value={value} onChange={onChange} {...inputProps} />
    )}
    {hint && <p className="field-hint">{hint}</p>}
  </div>
)

// One contact line: what prints (the value), whether it prints at all, and — for the first
// occupant only, since the labels are shared — the label printed in front of it.
const ContactRow = ({
  id,
  title,
  type,
  value,
  placeholder,
  onChange,
  showName,
  shown,
  onToggleShown,
  labelId,
  labelValue,
  labelPlaceholder,
  onLabelChange
}) => (
  <div className={`contact-row ${shown ? '' : 'contact-row--off'}`}>
    <div className="contact-row__head">
      <label htmlFor={id}>{title}</label>
      <Switch
        id={showName}
        name={showName}
        checked={shown}
        onChange={onToggleShown}
        className="switch--compact"
        aria-label={`Show ${title.toLowerCase()} on the sign`}
      >
        On sign
      </Switch>
    </div>
    <div className={`contact-row__fields ${labelId ? 'contact-row__fields--labelled' : ''}`}>
      {labelId && (
        <input
          type="text"
          id={labelId}
          name={labelId}
          className="contact-row__label-input"
          aria-label={`${title} label printed before the value`}
          placeholder={labelPlaceholder}
          value={labelValue}
          onChange={onLabelChange}
        />
      )}
      <input
        type={type}
        id={id}
        name={id}
        inputMode={type === 'tel' ? 'tel' : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  </div>
)

export const SignForm = ({ signData, onUpdate, departments }) => {
  // Which of the two people (or the room and its extra entry) the tabbed section shows.
  const [activeEntry, setActiveEntry] = useState(1)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    onUpdate({ [name]: type === 'checkbox' ? checked : value })
  }

  const handlePhoneChange = (e) => {
    onUpdate({ [e.target.name]: formatPhone(e.target.value) })
  }

  const isRoom = ROOM_TYPES.includes(signData.signType)
  const isPerson = !isRoom
  const supportsAlumni = ALUMNI_TYPES.includes(signData.signType)
  const hasSecond = Boolean(signData.showSecondOccupant)
  const entry = hasSecond ? activeEntry : 1

  const addSecond = () => {
    onUpdate({ showSecondOccupant: true })
    setActiveEntry(2)
  }

  // The second entry's fields are kept, so turning it back on restores them.
  const removeSecond = () => {
    onUpdate({ showSecondOccupant: false })
    setActiveEntry(1)
  }

  // Left blank, a person's email prints as first.last@unbc.ca from their name; the field shows
  // the address it will use.
  const emailPlaceholder = (suffix) => {
    if (!isPerson) return 'name@unbc.ca'
    const name = suffix ? signData.name2 : signData.name || getDefaultValues(signData.signType).name
    const derived = emailFromName(name)
    return derived ? `${derived} (from the name)` : 'first.last@unbc.ca'
  }

  const contactRows = (suffix, withLabels) => [
    {
      id: `email${suffix}`,
      title: 'Email',
      type: 'email',
      placeholder: emailPlaceholder(suffix),
      onChange: handleInputChange,
      labelId: withLabels ? 'emailLabel' : null,
      labelPlaceholder: 'No label'
    },
    {
      id: `phone${suffix}`,
      title: 'Phone',
      type: 'tel',
      placeholder: '250-960-XXXX',
      onChange: handlePhoneChange,
      labelId: withLabels ? 'phoneLabel' : null,
      labelPlaceholder: 'No label'
    },
    ...(isPerson ? [{
      id: `cellPhone${suffix}`,
      title: 'Cell',
      type: 'tel',
      placeholder: '778-XXX-XXXX',
      onChange: handlePhoneChange,
      labelId: withLabels ? 'cellPhoneLabel' : null,
      labelPlaceholder: 'No label'
    }] : [])
  ].map(row => {
    const base = row.id.replace(/2$/, '')
    const showName = `show${base[0].toUpperCase()}${base.slice(1)}${suffix}`
    return (
      <ContactRow
        key={row.id}
        {...row}
        value={signData[row.id]}
        showName={showName}
        shown={signData[showName]}
        onToggleShown={handleInputChange}
        labelValue={row.labelId ? signData[row.labelId] : undefined}
        onLabelChange={handleInputChange}
      />
    )
  })

  const tabLabels = isPerson
    ? [firstName(signData.name) || 'Person 1', firstName(signData.name2) || 'Person 2']
    : ['Room', signData.secondaryEntryType === 'room' ? 'Second room' : 'Contact']

  const alumniSwitch = (field, label) => supportsAlumni && (
    <div className="switch-list occupant-alumni">
      <Switch
        id={field}
        checked={Boolean(signData[field])}
        onChange={() => onUpdate({ [field]: !signData[field] })}
      >
        <strong>UNBC alumni crest</strong>
        <span className="switch__detail">{label ? `Beside ${label}’s name` : 'Beside the name'}</span>
      </Switch>
    </div>
  )

  const contactDetails = (suffix) => (
    <div className="occupant-contacts">
      <h3 className="form-subheading">Contact details</h3>
      <p className="form-subheading__hint">
        {suffix
          ? `Printed with the same labels as ${isPerson ? `${tabLabels[0]}’s` : 'the room’s'}.`
          : `Each line prints as “Label: value”. Clear a label to print the value on its own.${isPerson ? ' A blank email prints as first.last@unbc.ca.' : ''}`}
      </p>
      <div className="contact-rows">{contactRows(suffix, !suffix)}</div>
    </div>
  )

  const firstPanel = isPerson ? (
    <>
      <TextField
        id="name"
        label="Name"
        placeholder="e.g. Dr. Jane Doe"
        autoComplete="off"
        value={signData.name}
        onChange={handleInputChange}
      />
      <RolesEditor
        id="roles"
        roles={signData.roles}
        onChange={(roles) => onUpdate({ roles })}
      />
      <TextField
        id="tagline"
        label="Extra line"
        multiline
        rows={3}
        placeholder="Optional — e.g. Supporting the Spark Lab"
        hint={TAGLINE_HINT}
        value={signData.tagline}
        onChange={handleInputChange}
      />
      {alumniSwitch('showAlumni', hasSecond ? firstName(signData.name) : null)}
      {contactDetails('')}
    </>
  ) : (
    <>
      <TextField
        id="roomName"
        label="Room name"
        multiline
        rows={3}
        placeholder="e.g. Geographic Information Systems Lab"
        hint="Press Enter to control where the name breaks."
        value={signData.roomName}
        onChange={handleInputChange}
      />
      <TextField
        id="contactName"
        label="Contact line"
        placeholder="Optional — e.g. Contact: Dr. Jane Doe"
        value={signData.contactName}
        onChange={handleInputChange}
      />
      {contactDetails('')}
    </>
  )

  const secondPanel = (
    <>
      {isRoom && (
        <div className="form-group">
          <span className="field-label" id="secondaryEntryTypeLabel">What are you adding?</span>
          <SegmentedControl
            name="secondaryEntryType"
            options={SECONDARY_ROOM_ENTRY_OPTIONS}
            value={signData.secondaryEntryType}
            onChange={(value) => onUpdate({ secondaryEntryType: value })}
            aria-labelledby="secondaryEntryTypeLabel"
          />
        </div>
      )}

      {isPerson && (
        <>
          <TextField
            id="name2"
            label="Name"
            placeholder="e.g. Dr. John Smith"
            autoComplete="off"
            value={signData.name2}
            onChange={handleInputChange}
          />
          <RolesEditor
            id="roles2"
            roles={signData.roles2}
            onChange={(roles2) => onUpdate({ roles2 })}
            placeholder="e.g. Research Associate"
          />
          <TextField
            id="tagline2"
            label="Extra line"
            multiline
            rows={3}
            placeholder="Optional — e.g. Supporting the Spark Lab"
            hint={TAGLINE_HINT}
            value={signData.tagline2}
            onChange={handleInputChange}
          />
          {alumniSwitch('showAlumni2', firstName(signData.name2))}
        </>
      )}

      {isRoom && signData.secondaryEntryType === 'room' && (
        <TextField
          id="roomName2"
          label="Second room name"
          multiline
          rows={3}
          placeholder="e.g. Soil Science Lab"
          value={signData.roomName2}
          onChange={handleInputChange}
        />
      )}

      {isRoom && (
        <TextField
          id="contactName2"
          label={signData.secondaryEntryType === 'contact' ? 'Contact / role' : 'Second contact line'}
          placeholder={signData.secondaryEntryType === 'contact'
            ? 'e.g. Research Manager: Shayna Dolan'
            : 'Optional — e.g. Contact: Dr. Jane Doe'}
          value={signData.contactName2}
          onChange={handleInputChange}
        />
      )}

      {contactDetails('2')}

      <div className="occupant-remove">
        <button type="button" className="text-btn text-btn--danger" onClick={removeSecond}>
          {isPerson ? `Remove ${firstName(signData.name2) || 'second person'} from the sign` : `Remove the ${tabLabels[1].toLowerCase()}`}
        </button>
      </div>
    </>
  )

  const addLabel = isPerson ? 'Add person' : 'Add contact or room'

  return (
    <>
      <FormSection title="Sign">
        {/* Type and department share a row wherever there's room for both. */}
        <div className="sign-basics">
          <div className="form-group sign-basics__type">
            <label htmlFor="signType">Sign type</label>
            <CustomSelect
              id="signType"
              name="signType"
              options={SIGN_TYPE_OPTIONS}
              value={signData.signType}
              onChange={(value) => onUpdate({ signType: value })}
            />
          </div>

          <div className="department-field">
            <DepartmentSelector
              departments={departments}
              value={signData}
              onChange={onUpdate}
            />
          </div>
        </div>
      </FormSection>

      {/* One section for who (or what) is on the sign. A second person — or a room's extra
          contact or room — opens as a second tab instead of another section below. */}
      <FormSection
        title={isPerson ? (hasSecond ? 'People' : 'Person') : 'Room'}
        className="occupant-section"
        action={!hasSecond && (
          <button
            type="button"
            className="add-entry-btn"
            onClick={addSecond}
            aria-label={isPerson ? 'Add a second person who shares this door' : 'Add another contact, room, or lab to this sign'}
          >
            <span aria-hidden="true">+</span> {addLabel}
          </button>
        )}
      >
        {hasSecond && (
          <div className="occupant-tabs" role="tablist" aria-label={isPerson ? 'People on this sign' : 'Entries on this sign'}>
            {tabLabels.map((label, index) => {
              const tab = index + 1
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  id={`occupant-tab-${tab}`}
                  aria-selected={entry === tab}
                  aria-controls="occupant-panel"
                  tabIndex={entry === tab ? 0 : -1}
                  className={`occupant-tabs__tab ${entry === tab ? 'is-active' : ''}`}
                  onClick={() => setActiveEntry(tab)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                      event.preventDefault()
                      const next = tab === 1 ? 2 : 1
                      setActiveEntry(next)
                      document.getElementById(`occupant-tab-${next}`)?.focus()
                    }
                  }}
                >
                  <span className="occupant-tabs__index" aria-hidden="true">{tab}</span>
                  {label}
                </button>
              )
            })}
          </div>
        )}
        <div
          id="occupant-panel"
          className="occupant-panel"
          role={hasSecond ? 'tabpanel' : undefined}
          aria-labelledby={hasSecond ? `occupant-tab-${entry}` : undefined}
        >
          {entry === 1 ? firstPanel : secondPanel}
        </div>
      </FormSection>
    </>
  )
}
