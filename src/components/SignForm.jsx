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
    const formatted = formatPhone(e.target.value)
    onUpdate({ phone: formatted })
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
            <input
              type="text"
              id="position"
              name="position"
              placeholder="Enter Position"
              value={signData.position}
              onChange={handleInputChange}
            />
          </div>

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
          </div>
        </>
      )}

      {isRoom && (
        <div className="form-group">
          <label htmlFor="roomName">Room Name</label>
          <input
            type="text"
            id="roomName"
            name="roomName"
            placeholder="Enter room name"
            value={signData.roomName}
            onChange={handleInputChange}
          />
        </div>
      )}
    </form>
  )
}
