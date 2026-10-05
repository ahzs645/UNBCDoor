import React from 'react'
import { DepartmentSelector } from '@unbc/logo'
import { CustomSelect } from './CustomSelect'
import { FormSection } from './FormSection'
import { SegmentedControl } from './SegmentedControl'
import { Switch } from './Switch'
import { RolesEditor } from './RolesEditor'

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
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    onUpdate({ [name]: type === 'checkbox' ? checked : value })
  }

  const handlePhoneChange = (e) => {
    onUpdate({ [e.target.name]: formatPhone(e.target.value) })
  }

  const isRoom = ROOM_TYPES.includes(signData.signType)
  const isPerson = !isRoom

  const contactRows = (suffix, withLabels) => [
    {
      id: `email${suffix}`,
      title: 'Email',
      type: 'email',
      placeholder: 'name@unbc.ca',
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

  const secondTitle = isRoom ? 'Additional room content' : 'Second occupant'

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

      {isPerson ? (
        <FormSection title="Person">
          <TextField
            id="name"
            label="Name"
            placeholder="e.g. Dr. Jane Doe"
            autoComplete="off"
            value={signData.name}
            onChange={handleInputChange}
          />
          <TextField
            id="position"
            label="Position"
            multiline
            placeholder="e.g. Associate Professor"
            hint="Press Enter for a line break you want kept on the sign. Add more jobs as roles below."
            value={signData.position}
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
            hint="Press Enter for a line break you want kept on the sign."
            value={signData.tagline}
            onChange={handleInputChange}
          />
        </FormSection>
      ) : (
        <FormSection title="Room">
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
        </FormSection>
      )}

      <FormSection
        title="Contact details"
        description="Each line prints as “Label: value”. Clear a label to print the value on its own."
      >
        <div className="contact-rows">{contactRows('', true)}</div>
      </FormSection>

      <FormSection
        title={secondTitle}
        className="occupant-section"
        description={signData.showSecondOccupant ? null : (isRoom
          ? 'Add another contact, or a second room or lab, to this sign.'
          : 'Add a second person who shares this door.')}
        action={(
          <Switch
            id="showSecondOccupant"
            name="showSecondOccupant"
            checked={signData.showSecondOccupant}
            onChange={handleInputChange}
            aria-label={isRoom ? 'Add another contact, room, or lab to this sign' : 'Add a second occupant to this sign'}
            aria-controls="second-occupant-fields"
            aria-expanded={signData.showSecondOccupant}
          />
        )}
      >
        {signData.showSecondOccupant && (
          <div id="second-occupant-fields" className="occupant-section__fields">
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
                <TextField
                  id="position2"
                  label="Position"
                  multiline
                  placeholder="e.g. Research Associate"
                  value={signData.position2}
                  onChange={handleInputChange}
                />
                <RolesEditor
                  id="roles2"
                  roles={signData.roles2}
                  onChange={(roles2) => onUpdate({ roles2 })}
                />
                <TextField
                  id="tagline2"
                  label="Extra line"
                  multiline
                  rows={3}
                  placeholder="Optional — e.g. Supporting the Spark Lab"
                  value={signData.tagline2}
                  onChange={handleInputChange}
                />
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

            <div className="contact-rows">{contactRows('2', false)}</div>
          </div>
        )}
      </FormSection>
    </>
  )
}
