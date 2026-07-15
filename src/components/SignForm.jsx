import React from 'react'
import { DepartmentSelector } from '../unbc'
import { CustomSelect } from './CustomSelect'

const ROOM_TYPES = ['lab', 'general-room', 'custodian-closet']

const SIGN_TYPE_OPTIONS = [
  { value: 'faculty', label: 'Faculty' },
  { value: 'staff', label: 'Staff' },
  { value: 'student', label: 'Student' },
  { value: 'lab', label: 'Lab' },
  { value: 'general-room', label: 'General Room' },
  { value: 'custodian-closet', label: 'Custodian Closet' }
]

const SECONDARY_ROOM_ENTRY_OPTIONS = [
  { value: 'contact', label: 'Another contact for this room' },
  { value: 'room', label: 'Another room or lab' }
]

export const SignForm = ({ signData, onUpdate, departments }) => {
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    onUpdate({ [name]: type === 'checkbox' ? checked : value })
  }

  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
  }

  const handlePhoneChange = (e) => {
    onUpdate({ [e.target.name]: formatPhone(e.target.value) })
  }

  const isRoom = ROOM_TYPES.includes(signData.signType)
  const isPerson = !isRoom

  return (
    <form id="signForm">
      <div className="form-group">
        <label htmlFor="signType">Sign Type</label>
        <CustomSelect
          id="signType"
          name="signType"
          options={SIGN_TYPE_OPTIONS}
          value={signData.signType}
          onChange={(value) => onUpdate({ signType: value })}
        />
      </div>

      <DepartmentSelector
        departments={departments}
        value={signData}
        onChange={onUpdate}
      />

      {isPerson && (
        <>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter Name"
              value={signData.name}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="position">Position</label>
            <textarea
              id="position"
              name="position"
              rows="2"
              placeholder="Enter position. Use Enter for a fixed line break; pipes are preserved in Inline / pipe mode."
              value={signData.position}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tagline">Extra Line (optional)</label>
            <input
              type="text"
              id="tagline"
              name="tagline"
              placeholder="e.g. Supporting the Spark Lab"
              value={signData.tagline}
              onChange={handleInputChange}
            />
          </div>
        </>
      )}

      {isRoom && (
        <>
          <div className="form-group">
            <label htmlFor="roomName">Room Name</label>
            <textarea
              id="roomName"
              name="roomName"
              rows="3"
              placeholder="Enter room name. Use Enter to control line breaks."
              value={signData.roomName}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactName">Contact Line (optional)</label>
            <input
              type="text"
              id="contactName"
              name="contactName"
              placeholder="e.g. Contact: Dr. Jane Doe — or just a name"
              value={signData.contactName}
              onChange={handleInputChange}
            />
          </div>
        </>
      )}

      <div className="contact-info-group">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="enter.email@unbc.ca"
            value={signData.email}
            onChange={handleInputChange}
          />
          <label className="switch">
            <input
              type="checkbox"
              id="showEmail"
              name="showEmail"
              checked={signData.showEmail}
              onChange={handleInputChange}
            />
            <span className="switch__track" aria-hidden="true" />
            <span className="switch__text">Show on sign</span>
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder="250-960-XXXX"
            value={signData.phone}
            onChange={handlePhoneChange}
          />
          <label className="switch">
            <input
              type="checkbox"
              id="showPhone"
              name="showPhone"
              checked={signData.showPhone}
              onChange={handleInputChange}
            />
            <span className="switch__track" aria-hidden="true" />
            <span className="switch__text">Show on sign</span>
          </label>
        </div>

        {isPerson && (
          <div className="form-group">
            <label htmlFor="cellPhone">Cell (optional)</label>
            <input
              type="tel"
              id="cellPhone"
              name="cellPhone"
              placeholder="778-XXX-XXXX"
              value={signData.cellPhone}
              onChange={handlePhoneChange}
            />
            <label className="switch">
              <input
                type="checkbox"
                id="showCellPhone"
                name="showCellPhone"
                checked={signData.showCellPhone}
                onChange={handleInputChange}
              />
              <span className="switch__track" aria-hidden="true" />
              <span className="switch__text">Show on sign</span>
            </label>
          </div>
        )}
      </div>

      <div className="contact-label-group" aria-label="Contact line labels">
        <div className="form-group">
          <label htmlFor="emailLabel">Email label</label>
          <input
            type="text"
            id="emailLabel"
            name="emailLabel"
            placeholder="Leave blank for no label"
            value={signData.emailLabel}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="phoneLabel">Phone label</label>
          <input
            type="text"
            id="phoneLabel"
            name="phoneLabel"
            placeholder="e.g. Phone Number"
            value={signData.phoneLabel}
            onChange={handleInputChange}
          />
        </div>
        {isPerson && (
          <div className="form-group">
            <label htmlFor="cellPhoneLabel">Cell label</label>
            <input
              type="text"
              id="cellPhoneLabel"
              name="cellPhoneLabel"
              placeholder="e.g. Cell Number"
              value={signData.cellPhoneLabel}
              onChange={handleInputChange}
            />
          </div>
        )}
      </div>

      <fieldset className="occupant-section">
        <legend>{isRoom ? 'Additional room content' : 'Second occupant'}</legend>
        <div className="form-group occupant-section__toggle">
          <label className="switch">
          <input
            type="checkbox"
            id="showSecondOccupant"
            name="showSecondOccupant"
            checked={signData.showSecondOccupant}
            onChange={handleInputChange}
            aria-controls="second-occupant-fields"
            aria-expanded={signData.showSecondOccupant}
          />
          <span className="switch__track" aria-hidden="true" />
          <span className="switch__text">
            {isRoom ? 'Add another contact, room, or lab to this sign' : 'Add a second occupant to this sign'}
          </span>
          </label>
          {!signData.showSecondOccupant && (
            <p className="occupant-section__hint">
              Turn this on to reveal the {isRoom ? 'additional contact or room' : 'second person'} fields.
            </p>
          )}
        </div>

      {signData.showSecondOccupant && (
        <div id="second-occupant-fields" className="occupant-section__fields">
          {isRoom && (
            <div className="form-group">
              <label htmlFor="secondaryEntryType">What are you adding?</label>
              <CustomSelect
                id="secondaryEntryType"
                name="secondaryEntryType"
                options={SECONDARY_ROOM_ENTRY_OPTIONS}
                value={signData.secondaryEntryType}
                onChange={(value) => onUpdate({ secondaryEntryType: value })}
              />
            </div>
          )}

          {isPerson && (
            <>
              <div className="form-group">
                <label htmlFor="name2">Second Occupant Name</label>
                <input
                  type="text"
                  id="name2"
                  name="name2"
                  placeholder="Enter Name"
                  value={signData.name2}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="position2">Second Occupant Position</label>
                <textarea
                  id="position2"
                  name="position2"
                  rows="2"
                  placeholder="Enter position. Use Enter for a fixed line break."
                  value={signData.position2}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="tagline2">Second Occupant Extra Line (optional)</label>
                <input
                  type="text"
                  id="tagline2"
                  name="tagline2"
                  placeholder="e.g. Supporting the Spark Lab"
                  value={signData.tagline2}
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}

          {isRoom && signData.secondaryEntryType === 'room' && (
            <>
              <div className="form-group">
                <label htmlFor="roomName2">Second Room Name</label>
                <textarea
                  id="roomName2"
                  name="roomName2"
                  rows="3"
                  placeholder="Enter room name. Use Enter to control line breaks."
                  value={signData.roomName2}
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}

          {isRoom && (
            <div className="form-group">
              <label htmlFor="contactName2">
                {signData.secondaryEntryType === 'contact' ? 'Additional Contact / Role' : 'Second Contact Line (optional)'}
              </label>
              <input
                type="text"
                id="contactName2"
                name="contactName2"
                placeholder={signData.secondaryEntryType === 'contact'
                  ? 'e.g. Research Manager: Shayna Dolan'
                  : 'e.g. Contact: Dr. Jane Doe — or just a name'}
                value={signData.contactName2}
                onChange={handleInputChange}
              />
            </div>
          )}

          <div className="contact-info-group">
            <div className="form-group">
              <label htmlFor="email2">Email (optional)</label>
              <input
                type="email"
                id="email2"
                name="email2"
                placeholder="enter.email@unbc.ca"
                value={signData.email2}
                onChange={handleInputChange}
              />
              <label className="switch">
                <input
                  type="checkbox"
                  id="showEmail2"
                  name="showEmail2"
                  checked={signData.showEmail2}
                  onChange={handleInputChange}
                />
                <span className="switch__track" aria-hidden="true" />
                <span className="switch__text">Show on sign</span>
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="phone2">Phone (optional)</label>
              <input
                type="tel"
                id="phone2"
                name="phone2"
                placeholder="250-960-XXXX"
                value={signData.phone2}
                onChange={handlePhoneChange}
              />
              <label className="switch">
                <input
                  type="checkbox"
                  id="showPhone2"
                  name="showPhone2"
                  checked={signData.showPhone2}
                  onChange={handleInputChange}
                />
                <span className="switch__track" aria-hidden="true" />
                <span className="switch__text">Show on sign</span>
              </label>
            </div>

            {isPerson && (
              <div className="form-group">
                <label htmlFor="cellPhone2">Cell (optional)</label>
                <input
                  type="tel"
                  id="cellPhone2"
                  name="cellPhone2"
                  placeholder="778-XXX-XXXX"
                  value={signData.cellPhone2}
                  onChange={handlePhoneChange}
                />
                <label className="switch">
                  <input
                    type="checkbox"
                    id="showCellPhone2"
                    name="showCellPhone2"
                    checked={signData.showCellPhone2}
                    onChange={handleInputChange}
                  />
                  <span className="switch__track" aria-hidden="true" />
                  <span className="switch__text">Show on sign</span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}
      </fieldset>
    </form>
  )
}
