import React, { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { AlumniLogo } from '../brand/alumni/AlumniLogo'
import { UNBCLogo } from '../brand/unbc/UNBCLogo'
import { getDepartmentDisplayName } from '../organization/departmentHierarchy'

export const SignPreview = ({ signData, cardHolders }) => {
  const signRef = useRef(null)
  const [paperSize, setPaperSize] = useState('letter')
  const DEFAULT_INSERT_SIZE = { width: 8.5, height: 5.5 }

  const formatInches = (value) => {
    if (Number.isInteger(value)) {
      return value.toString()
    }

    return value.toFixed(2).replace(/\.00$/, '').replace(/0$/, '')
  }
  const exportSign = async (format = 'png') => {
    if (signRef.current) {
      try {
        const canvas = await html2canvas(signRef.current, {
          backgroundColor: '#ffffff',
          scale: 3
        })
        
        if (format === 'png') {
          const link = document.createElement('a')
          link.download = 'unbc-door-sign.png'
          link.href = canvas.toDataURL()
          link.click()
        }
      } catch (error) {
        console.error('Error exporting sign:', error)
      }
    }
  }

  const exportPDF = async () => {
    if (signRef.current) {
      try {
        // Paper dimensions
        const paperDimensions = {
          letter: { width: 8.5, height: 11 },
          a4: { width: 8.27, height: 11.69 }
        }
        
        const paper = paperDimensions[paperSize]
        const orientation = paper.width > paper.height ? 'landscape' : 'portrait'
        
        // Create PDF with selected paper size
        const pdf = new jsPDF({
          orientation: orientation,
          unit: 'in',
          format: paperSize
        })
        
        // Capture the actual preview as shown
        const canvas = await html2canvas(signRef.current, {
          backgroundColor: '#ffffff',
          scale: 4, // High resolution for print
          useCORS: true
        })
        
        const imgData = canvas.toDataURL('image/png')
        
        // Get actual dimensions of the captured element
        const elementRect = signRef.current.getBoundingClientRect()
        const actualWidth = elementRect.width / 96 // Convert pixels to inches (96 DPI)
        const actualHeight = elementRect.height / 96
        
        // Calculate centering position
        const xOffset = (paper.width - actualWidth) / 2
        const yOffset = (paper.height - actualHeight) / 2
        
        // Add the sign image centered on paper
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, actualWidth, actualHeight)
        
        // Add cut lines around the actual card edges
        pdf.setDrawColor(0, 0, 0)
        pdf.setLineWidth(0.01)
        
        // Corner cut marks (0.25 inch long)
        const markLength = 0.25
        
        // Top-left corner
        pdf.line(xOffset - markLength, yOffset, xOffset, yOffset)
        pdf.line(xOffset, yOffset - markLength, xOffset, yOffset)
        
        // Top-right corner
        pdf.line(xOffset + actualWidth, yOffset, xOffset + actualWidth + markLength, yOffset)
        pdf.line(xOffset + actualWidth, yOffset - markLength, xOffset + actualWidth, yOffset)
        
        // Bottom-left corner
        pdf.line(xOffset - markLength, yOffset + actualHeight, xOffset, yOffset + actualHeight)
        pdf.line(xOffset, yOffset + actualHeight, xOffset, yOffset + actualHeight + markLength)
        
        // Bottom-right corner
        pdf.line(xOffset + actualWidth, yOffset + actualHeight, xOffset + actualWidth + markLength, yOffset + actualHeight)
        pdf.line(xOffset + actualWidth, yOffset + actualHeight, xOffset + actualWidth, yOffset + actualHeight + markLength)
        
        // Add paper size info
        pdf.setFontSize(8)
        pdf.setTextColor(128, 128, 128)
        pdf.text(`Paper: ${paperSize.toUpperCase()}`, paper.width / 2, paper.height - 0.3, { align: 'center' })
        
        // Save the PDF
        const filename = `unbc-door-sign-${signData.signType || 'custom'}.pdf`
        pdf.save(filename)
      } catch (error) {
        console.error('Error exporting PDF:', error)
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

  const renderContent = () => {
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

  const insertSize = selectedCardHolder?.insertSize || DEFAULT_INSERT_SIZE
  const viewableSize = selectedCardHolder?.viewableSize || insertSize

  const horizontalDifference = Math.max(insertSize.width - viewableSize.width, 0)
  const verticalDifference = Math.max(insertSize.height - viewableSize.height, 0)

  const viewableOffset = selectedCardHolder?.viewableOffset || {
    top: verticalDifference,
    bottom: 0,
    left: horizontalDifference / 2,
    right: horizontalDifference / 2
  }

  const aspectRatio = insertSize.width / insertSize.height

  const previewFrameStyle = {
    '--sign-aspect': aspectRatio,
    '--holder-bar-top': `${(Math.max(viewableOffset.top, 0) / insertSize.height) * 100}%`,
    '--holder-bar-bottom': `${(Math.max(viewableOffset.bottom, 0) / insertSize.height) * 100}%`,
    '--holder-bar-left': `${(Math.max(viewableOffset.left, 0) / insertSize.width) * 100}%`,
    '--holder-bar-right': `${(Math.max(viewableOffset.right, 0) / insertSize.width) * 100}%`
  }

  const doorSignClass = `door-sign ${signData.signType || 'faculty'} ${selectedCardHolder ? 'with-holder' : ''}`

  const measurementSummary = selectedCardHolder ? [
    {
      label: 'Insert',
      value: `${formatInches(insertSize.width)}" × ${formatInches(insertSize.height)}"`
    },
    {
      label: 'Viewable',
      value: `${formatInches(viewableSize.width)}" × ${formatInches(viewableSize.height)}"`
    }
  ] : [
    {
      label: 'Default insert',
      value: `${formatInches(DEFAULT_INSERT_SIZE.width)}" × ${formatInches(DEFAULT_INSERT_SIZE.height)}"`
    }
  ]

  return (
    <>
      <div className="preview">
        <div
          className={`preview-frame ${selectedCardHolder ? 'with-holder' : 'without-holder'}`}
          style={previewFrameStyle}
        >
          <div className={doorSignClass} ref={signRef}>
            <div className="sign-header">
              <UNBCLogo departmentText={getDepartmentDisplayName(signData)} />
            </div>
            <div className="sign-content">
              <div className="main-content">
                {renderContent()}
              </div>
              {shouldShowAlumni && (
                <div className="alumni-badge" style={{ display: 'block' }}>
                  <AlumniLogo width={80} height={92} />
                </div>
              )}
            </div>
          </div>

          {selectedCardHolder && (
            <div className="card-holder-overlay" aria-hidden="true">
              <span className="card-holder-bar top" />
              <span className="card-holder-bar bottom" />
              <span className="card-holder-bar left" />
              <span className="card-holder-bar right" />
            </div>
          )}
        </div>

        <div className="preview-measurements">
          {selectedCardHolder && (
            <div className="preview-measurements__title">{selectedCardHolder.name}</div>
          )}
          <div className="preview-measurements__list">
            {measurementSummary.map(({ label, value }) => (
              <div key={label} className="preview-measurements__item">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="export-section">
        <div className="paper-size-selector">
          <label>Paper Size:</label>
          <div className="paper-size-options">
            <label className={`paper-option ${paperSize === 'letter' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="paperSize" 
                value="letter" 
                checked={paperSize === 'letter'}
                onChange={(e) => setPaperSize(e.target.value)}
              />
              Letter (8.5" × 11")
            </label>
            <label className={`paper-option ${paperSize === 'a4' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="paperSize" 
                value="a4" 
                checked={paperSize === 'a4'}
                onChange={(e) => setPaperSize(e.target.value)}
              />
              A4 (210mm × 297mm)
            </label>
          </div>
        </div>
        <div className="export-buttons">
          <button type="button" onClick={() => exportSign('png')} className="export-btn">
            Export as PNG
          </button>
          <button type="button" onClick={exportPDF} className="export-btn pdf-export">
            Export as PDF (Print-Ready)
          </button>
        </div>
      </div>
    </>
  )
}
