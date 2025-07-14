import React, { useRef, useEffect, useState } from 'react'
import html2canvas from 'html2canvas'

export const SignPreview = ({ signData, cardHolders }) => {
  const signRef = useRef(null)
  const [svgContent, setSvgContent] = useState('')

  const exportSign = async () => {
    if (signRef.current) {
      try {
        const canvas = await html2canvas(signRef.current, {
          backgroundColor: '#ffffff',
          scale: 2
        })
        
        const link = document.createElement('a')
        link.download = 'unbc-door-sign.png'
        link.href = canvas.toDataURL()
        link.click()
      } catch (error) {
        console.error('Error exporting sign:', error)
      }
    }
  }

  const getDefaultValues = (signType) => {
    switch(signType) {
      case 'faculty':
      case 'staff':
        return {
          name: 'Dr. John Smith',
          position: 'Professor',
          email: 'john.smith@unbc.ca',
          phone: '250-960-5555'
        }
      case 'student':
        return {
          name: 'Student Name',
          email: 'student@unbc.ca'
        }
      case 'lab':
        return {
          roomName: 'Research Lab'
        }
      case 'general-room':
        return {
          roomName: 'Conference Room'
        }
      case 'custodian-closet':
        return {
          roomName: 'Storage Room'
        }
      default:
        return {}
    }
  }

  const defaults = getDefaultValues(signData.signType)
  const getName = () => signData.name || defaults.name || ''
  const getPosition = () => signData.position || defaults.position || ''
  const getEmail = () => signData.email || defaults.email || ''
  const getPhone = () => signData.phone || defaults.phone || ''
  const getRoomName = () => signData.roomName || defaults.roomName || ''

  const getDepartmentDisplay = () => {
    // Use the most specific department level available for display
    if (signData.subSubDepartment) {
      return signData.subSubDepartment
    } else if (signData.subDepartment) {
      return signData.subDepartment
    } else if (signData.mainDepartment) {
      return signData.mainDepartment
    }
    return ''
  }

  // Load SVG content on component mount
  useEffect(() => {
    const loadSVG = async () => {
      try {
        const response = await fetch('/components/unbc-logo.svg')
        const svgText = await response.text()
        setSvgContent(svgText)
        console.log('SVG loaded successfully')
      } catch (error) {
        console.error('Error loading SVG:', error)
      }
    }
    
    loadSVG()
  }, [])

  const updateSVGText = (departmentText) => {
    // Wait a bit for the SVG to be rendered in the DOM
    setTimeout(() => {
      const textElement = signRef.current?.querySelector('#svgDepartmentText')
      if (!textElement) {
        console.log('SVG text element not found in sign preview')
        return
      }

      console.log('Updating SVG text with:', departmentText)

      // Clear existing tspans
      textElement.innerHTML = ''

      if (departmentText) {
        // Split text into words and create lines to fit within the SVG space
        const words = departmentText.split(' ')
        let currentLine = ''
        const lines = []
        const maxCharsPerLine = 24 // Max chars per line for the SVG

        words.forEach(word => {
          if ((currentLine + word).length <= maxCharsPerLine) {
            currentLine += (currentLine ? ' ' : '') + word
          } else {
            if (currentLine) lines.push(currentLine)
            currentLine = word
          }
        })
        if (currentLine) lines.push(currentLine)

        // Create tspan elements for each line
        lines.forEach((line, index) => {
          const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
          tspan.setAttribute('x', '0')
          tspan.setAttribute('y', index * 10) // 10 units between lines
          tspan.textContent = line
          textElement.appendChild(tspan)
        })
        
        // If 3+ lines, move the entire logo group up
        const logoGroup = signRef.current?.querySelector('#logoAndTextGroup')
        if (logoGroup) {
          if (lines.length >= 3) {
            // Move up by 10 units (approximately 1 line height)
            logoGroup.setAttribute('transform', 'translate(0, 5)')
            console.log(`Moving logo up for ${lines.length} lines of text`)
          } else {
            // Reset to original position
            logoGroup.setAttribute('transform', 'translate(0, 15)')
          }
        }
        
        console.log('SVG text updated successfully')
      }
    }, 100)
  }

  // Update SVG text whenever department data changes or SVG content loads
  useEffect(() => {
    if (svgContent) {
      const departmentText = getDepartmentDisplay()
      updateSVGText(departmentText)
    }
  }, [signData.departmentType, signData.mainDepartment, signData.subDepartment, signData.subSubDepartment, svgContent])

  const renderContent = () => {
    const departmentText = getDepartmentDisplay()
    
    if (signData.signType === 'faculty' || signData.signType === 'staff') {
      const name = getName()
      const position = getPosition()
      const email = getEmail()
      const phone = getPhone()
      
      return (
        <>
          {name && <div className="name">{name}</div>}
          {position && <div className="position">{position}</div>}
          {((email && signData.showEmail) || (phone && signData.showPhone)) && (
            <div className="contact-info">
              {email && signData.showEmail && <div>Email: {email}</div>}
              {phone && signData.showPhone && <div>Phone: {phone}</div>}
            </div>
          )}
          {signData.showDesignations && signData.designations?.length > 0 && (
            <div className="designations">{signData.designations.join(', ')}</div>
          )}
        </>
      )
    } else if (signData.signType === 'student') {
      const name = getName()
      const email = getEmail()
      
      return (
        <>
          {name && <div className="name">{name}</div>}
          {email && (
            <div className="contact-info">
              <div>Email: {email}</div>
            </div>
          )}
        </>
      )
    } else if (['lab', 'general-room', 'custodian-closet'].includes(signData.signType)) {
      const roomName = getRoomName()
      
      return (
        <>
          {roomName && <div className="room-name">{roomName}</div>}
        </>
      )
    }
    
    return null
  }

  const shouldShowAlumni = (signData.signType === 'faculty' || signData.signType === 'staff') && signData.showAlumni
  const selectedCardHolder = signData.cardHolderType ? cardHolders[signData.cardHolderType] : null
  
  // Calculate dimensions based on card holder or default
  const getSignDimensions = () => {
    if (selectedCardHolder) {
      const { viewableArea, totalArea } = selectedCardHolder
      // Use viewable area for the sign content, total area for the container
      const aspectRatio = viewableArea.width / viewableArea.height
      const maxWidth = 450 // Max width in pixels for the preview
      const width = Math.min(maxWidth, maxWidth)
      const height = width / aspectRatio
      
      return {
        containerWidth: width * (totalArea.width / viewableArea.width),
        containerHeight: height * (totalArea.height / viewableArea.height),
        signWidth: width,
        signHeight: height,
        marginX: (width * (totalArea.width / viewableArea.width) - width) / 2,
        marginY: (height * (totalArea.height / viewableArea.height) - height) / 2
      }
    }
    
    // Default dimensions (8.5" x 5.5" aspect ratio)
    return {
      containerWidth: 500,
      containerHeight: 300,
      signWidth: 500,
      signHeight: 300,
      marginX: 0,
      marginY: 0
    }
  }

  const dimensions = getSignDimensions()
  const doorSignClass = `door-sign ${signData.signType || 'faculty'} ${selectedCardHolder ? 'card-holder-preview' : ''}`

  const containerStyle = selectedCardHolder ? {
    width: `${dimensions.containerWidth}px`,
    height: `${dimensions.containerHeight}px`,
    border: '2px dashed #ccc',
    position: 'relative',
    background: '#f9f9f9',
    margin: '0 auto'
  } : {}

  const signStyle = {
    width: `${dimensions.signWidth}px`,
    height: `${dimensions.signHeight}px`,
    position: selectedCardHolder ? 'absolute' : 'relative',
    top: selectedCardHolder ? `${dimensions.marginY}px` : 'auto',
    left: selectedCardHolder ? `${dimensions.marginX}px` : 'auto',
    margin: selectedCardHolder ? '0' : '0 auto'
  }

  return (
    <>
      <div className="preview">
        {selectedCardHolder ? (
          <div style={containerStyle}>
            <div className={doorSignClass} ref={signRef} style={signStyle}>
              <div className="sign-header">
                <div className="unbc-logo" dangerouslySetInnerHTML={{ __html: svgContent }} />
              </div>
              <div className="sign-content">
                <div className="main-content">
                  {renderContent()}
                </div>
                {shouldShowAlumni && (
                  <div className="alumni-badge" style={{ display: 'block' }}>
                    <object data="/components/alumni-badge.svg" type="image/svg+xml" width="80" height="92"></object>
                  </div>
                )}
              </div>
            </div>
            <div style={{
              position: 'absolute',
              top: '5px',
              left: '5px',
              fontSize: '10px',
              color: '#666',
              background: 'rgba(255,255,255,0.8)',
              padding: '2px 4px',
              borderRadius: '2px'
            }}>
              Card Holder Preview ({(dimensions.containerWidth/50).toFixed(1)}" × {(dimensions.containerHeight/50).toFixed(1)}")
            </div>
          </div>
        ) : (
          <div className={doorSignClass} ref={signRef} style={signStyle}>
            <div className="sign-header">
              <div className="unbc-logo" dangerouslySetInnerHTML={{ __html: svgContent }} />
            </div>
            <div className="sign-content">
              <div className="main-content">
                {renderContent()}
              </div>
              {shouldShowAlumni && (
                <div className="alumni-badge" style={{ display: 'block' }}>
                  <object data="/components/alumni-badge.svg" type="image/svg+xml" width="80" height="92"></object>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <button type="button" onClick={exportSign} className="export-btn">
        Export Sign
      </button>
    </>
  )
}