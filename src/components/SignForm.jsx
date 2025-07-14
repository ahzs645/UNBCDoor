import React, { useState, useRef, useEffect } from 'react'

export const SignForm = ({ signData, onUpdate, departments, onSearchDepartments }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const searchInputRef = useRef(null)
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

  const searchDepartments = (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    const results = []
    const queryLower = query.toLowerCase()

    Object.entries(departments).forEach(([typeKey, typeData]) => {
      Object.entries(typeData.departments).forEach(([mainKey, mainData]) => {
        Object.entries(mainData).forEach(([subKey, subData]) => {
          // Check if this department matches the search
          if (subKey.toLowerCase().includes(queryLower)) {
            results.push({
              type: typeKey,
              typeName: typeData.name,
              main: mainKey,
              sub: subKey,
              path: `${typeData.name} > ${mainKey} > ${subKey}`
            })
          }

          // If subData is an object (has sub-sub departments), search those too
          if (typeof subData === 'object' && !Array.isArray(subData)) {
            Object.entries(subData).forEach(([subSubKey, subSubData]) => {
              if (subSubKey.toLowerCase().includes(queryLower)) {
                results.push({
                  type: typeKey,
                  typeName: typeData.name,
                  main: mainKey,
                  sub: subKey,
                  subSub: subSubKey,
                  path: `${typeData.name} > ${mainKey} > ${subKey} > ${subSubKey}`
                })
              }
            })
          }
        })
      })
    })

    setSearchResults(results.slice(0, 10)) // Limit to 10 results
    setShowSearchResults(true)
  }

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    searchDepartments(query)
  }

  const selectDepartment = (result) => {
    console.log('Selecting department:', result)
    
    const updates = {
      departmentType: result.type,
      mainDepartment: result.main,
      subDepartment: result.sub,
      subSubDepartment: result.subSub || ''
    }
    
    console.log('Department updates:', updates)
    onUpdate(updates)
    
    setSearchQuery('')
    setShowSearchResults(false)
    setSearchResults([])
  }

  const handleSearchBlur = () => {
    // Delay hiding results to allow click on results
    setTimeout(() => setShowSearchResults(false), 150)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

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

      <div className="form-group" ref={searchInputRef} style={{ position: 'relative' }}>
        <label htmlFor="departmentSearch">Search Departments</label>
        <input 
          type="text" 
          id="departmentSearch" 
          placeholder="Search departments..." 
          className="search-input"
          value={searchQuery}
          onChange={handleSearchChange}
          onBlur={handleSearchBlur}
          onFocus={() => searchQuery && setShowSearchResults(true)}
        />
        
        {showSearchResults && searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((result, index) => (
              <div 
                key={index}
                className="search-result-item"
                onClick={() => selectDepartment(result)}
              >
                <div className="search-result-path">{result.path}</div>
                <div style={{ fontSize: '0.8em', color: '#666', marginTop: '2px' }}>
                  {result.type} → {result.main} → {result.sub} {result.subSub ? `→ ${result.subSub}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showSearchResults && searchResults.length === 0 && searchQuery && (
          <div className="search-results">
            <div className="search-result-item no-results">
              No departments found for "{searchQuery}"
            </div>
          </div>
        )}
      </div>

      {(signData.departmentType || signData.mainDepartment || signData.subDepartment || signData.subSubDepartment) && (
        <div className="department-selection-display">
          <div className="department-header">
            <div className="department-title">
              <span className="department-icon">🏛️</span>
              <strong>Selected Department</strong>
            </div>
            {signData.departmentType && (
              <span className="department-type-badge">{signData.departmentType}</span>
            )}
          </div>
          <div className="department-path">
            {signData.mainDepartment && (
              <span className="department-level main">{signData.mainDepartment}</span>
            )}
            {signData.subDepartment && (
              <>
                <span className="department-arrow">→</span>
                <span className="department-level sub">{signData.subDepartment}</span>
              </>
            )}
            {signData.subSubDepartment && (
              <>
                <span className="department-arrow">→</span>
                <span className="department-level subsub">{signData.subSubDepartment}</span>
              </>
            )}
          </div>
        </div>
      )}

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