import React from 'react'
import { DepartmentSelector } from '../unbc'

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

  return (
    <form id="signForm">
      <div className="form-group">
        <label htmlFor="signType">Sign Type</label>
        <select 
          id="signType" 
          name="signType" 
          value={signData.signType} 
          onChange={handleInputChange}
        >
          <option value="faculty">Faculty</option>
          <option value="staff">Staff</option>
          <option value="student">Student</option>
          <option value="lab">Lab</option>
          <option value="general-room">General Room</option>
          <option value="custodian-closet">Custodian Closet</option>
        </select>
      </div>

      <DepartmentSelector
        departments={departments}
        value={signData}
        onChange={onUpdate}
      />

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
          <div className="show-toggle">
            <input 
              type="checkbox" 
              id="showEmail" 
              name="showEmail"
              checked={signData.showEmail}
              onChange={handleInputChange}
            />
            <label htmlFor="showEmail">Show</label>
          </div>
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
          <div className="show-toggle">
            <input 
              type="checkbox" 
              id="showPhone"
              name="showPhone" 
              checked={signData.showPhone}
              onChange={handleInputChange}
            />
            <label htmlFor="showPhone">Show</label>
          </div>
        </div>
      </div>

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
    </form>
  )
}
