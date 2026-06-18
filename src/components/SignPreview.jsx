import React, { useRef, useState } from 'react'
import { jsPDF } from 'jspdf'
import { svg2pdf } from 'svg2pdf.js'
import { SignArtwork } from '../sign/SignArtwork'
import { registerArtworkFonts, ARTWORK_ITALIC_FAMILY, ARTWORK_BLACK_FAMILY } from '../sign/pdfFonts'
import { getDepartmentDisplayName } from '../unbc'

const PT_PER_INCH = 72

export const SignPreview = ({ signData, cardHolders }) => {
  const signRef = useRef(null)
  const [paperSize, setPaperSize] = useState('letter')
  const [headlineWeight, setHeadlineWeight] = useState('bold')
  const [roomNameStyle, setRoomNameStyle] = useState('standard')
  const DEFAULT_INSERT_SIZE = { width: 8.5, height: 5.5 }

  const formatInches = (value) => {
    if (Number.isInteger(value)) {
      return value.toString()
    }

    return value.toFixed(2).replace(/\.00$/, '').replace(/0$/, '')
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

  const isRoomType = ['lab', 'general-room', 'custodian-closet'].includes(signData.signType)

  const doorSignClass = [
    'door-sign',
    signData.signType || 'faculty',
    selectedCardHolder ? 'with-holder' : ''
  ].filter(Boolean).join(' ')

  // Single source of truth for the artwork — used by the preview and both exporters.
  const signContent = {
    signType: signData.signType || 'faculty',
    departmentText: getDepartmentDisplayName(signData),
    name: getName(),
    credentials: (signData.showDesignations && signData.designations?.length > 0)
      ? signData.designations.join(', ')
      : '',
    position: getPosition(),
    email: getEmail(),
    phone: getPhone(),
    showEmail: signData.showEmail,
    showPhone: signData.showPhone,
    roomName: getRoomName(),
    showAlumni: shouldShowAlumni,
    headlineWeight,
    roomNameStyle,
    insert: insertSize
  }

  const cloneArtworkForExport = (availableFonts = {}) => {
    const source = signRef.current
    if (!source) return null
    const clone = source.cloneNode(true)

    const italicFamily = availableFonts[ARTWORK_ITALIC_FAMILY]
    const blackFamily = availableFonts[ARTWORK_BLACK_FAMILY]

    const useFamily = (node, family) => {
      // The embedded face already carries its weight/slant, so reference it as normal/normal.
      node.setAttribute('font-family', family)
      node.setAttribute('font-style', 'normal')
      node.setAttribute('font-weight', 'normal')
      node.style.fontFamily = family
      node.style.fontStyle = 'normal'
      node.style.fontWeight = 'normal'
    }

    // Upright regular/bold ride jsPDF's standard Helvetica (crisp, selectable, no embedding).
    // Italic and Black route to the embedded brand faces — svg2pdf can't drive standard-Helvetica
    // italic under jsPDF v3, and standard Helvetica has no Black weight at all.
    clone.setAttribute('font-family', 'helvetica')
    clone.querySelectorAll('text').forEach((node) => {
      const weight = parseInt(node.getAttribute('font-weight'), 10) || 400
      const isItalic = node.getAttribute('font-style') === 'italic'

      if (isItalic && italicFamily) return useFamily(node, italicFamily)
      if (weight >= 800 && blackFamily) return useFamily(node, blackFamily)

      // Standard Helvetica only has normal/bold — collapse other weights so svg2pdf matches
      // the face instead of silently falling back to Times.
      const fontWeight = weight >= 600 ? 'bold' : 'normal'
      node.setAttribute('font-family', 'helvetica')
      node.setAttribute('font-weight', fontWeight)
      node.setAttribute('font-style', 'normal')
      node.style.fontFamily = 'helvetica'
      node.style.fontWeight = fontWeight
      node.style.fontStyle = 'normal'
    })
    return clone
  }

  const exportPNG = () => {
    const source = signRef.current
    if (!source) return

    const [, , viewW, viewH] = (source.getAttribute('viewBox') || '0 0 612 396')
      .split(/\s+/)
      .map(Number)

    // Rasterize the artwork as-authored (keeps font-style italic for the browser to render).
    const clone = source.cloneNode(true)
    clone.setAttribute('width', viewW)
    clone.setAttribute('height', viewH)

    const xml = new XMLSerializer().serializeToString(clone)
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`
    const scale = 4

    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = viewW * scale
      canvas.height = viewH * scale
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      ctx.drawImage(image, 0, 0)

      const link = document.createElement('a')
      link.download = 'unbc-door-sign.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    image.onerror = (error) => console.error('Error exporting PNG:', error)
    image.src = svgUrl
  }

  const exportPDF = async () => {
    const source = signRef.current
    if (!source) return

    try {
      const paperDimensions = {
        letter: { width: 8.5, height: 11 },
        a4: { width: 8.27, height: 11.69 }
      }
      const paper = paperDimensions[paperSize]

      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: paperSize })
      const availableFonts = await registerArtworkFonts(doc)

      const artWidth = insertSize.width * PT_PER_INCH
      const artHeight = insertSize.height * PT_PER_INCH
      const pageWidth = paper.width * PT_PER_INCH
      const pageHeight = paper.height * PT_PER_INCH
      const xOffset = (pageWidth - artWidth) / 2
      const yOffset = (pageHeight - artHeight) / 2

      // svg2pdf needs the node laid out in the document to resolve geometry/styles.
      const clone = cloneArtworkForExport(availableFonts)
      clone.setAttribute('width', artWidth)
      clone.setAttribute('height', artHeight)

      const holder = document.createElement('div')
      holder.style.cssText = 'position:fixed;left:-10000px;top:0;opacity:0;pointer-events:none;'
      holder.appendChild(clone)
      document.body.appendChild(holder)

      try {
        await svg2pdf(clone, doc, { x: xOffset, y: yOffset, width: artWidth, height: artHeight })
      } finally {
        holder.remove()
      }

      // Vector crop marks at the artwork corners (0.25" arms).
      const mark = 0.25 * PT_PER_INCH
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.75)

      doc.line(xOffset - mark, yOffset, xOffset, yOffset)
      doc.line(xOffset, yOffset - mark, xOffset, yOffset)

      doc.line(xOffset + artWidth, yOffset, xOffset + artWidth + mark, yOffset)
      doc.line(xOffset + artWidth, yOffset - mark, xOffset + artWidth, yOffset)

      doc.line(xOffset - mark, yOffset + artHeight, xOffset, yOffset + artHeight)
      doc.line(xOffset, yOffset + artHeight, xOffset, yOffset + artHeight + mark)

      doc.line(xOffset + artWidth, yOffset + artHeight, xOffset + artWidth + mark, yOffset + artHeight)
      doc.line(xOffset + artWidth, yOffset + artHeight, xOffset + artWidth, yOffset + artHeight + mark)

      doc.save(`unbc-door-sign-${signData.signType || 'custom'}.pdf`)
    } catch (error) {
      console.error('Error exporting PDF:', error)
    }
  }

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
          <div className={doorSignClass}>
            <SignArtwork ref={signRef} content={signContent} />
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
      <div className="sign-style-section">
        <div className="style-control">
          <span className="style-control__label">Headline Weight</span>
          <div className="style-options">
            <label className={`style-option ${headlineWeight === 'bold' ? 'active' : ''}`}>
              <input
                type="radio"
                name="headlineWeight"
                value="bold"
                checked={headlineWeight === 'bold'}
                onChange={(e) => setHeadlineWeight(e.target.value)}
              />
              Bold
            </label>
            <label className={`style-option ${headlineWeight === 'black' ? 'active' : ''}`}>
              <input
                type="radio"
                name="headlineWeight"
                value="black"
                checked={headlineWeight === 'black'}
                onChange={(e) => setHeadlineWeight(e.target.value)}
              />
              Black
            </label>
          </div>
        </div>

        {isRoomType && (
          <div className="style-control">
            <span className="style-control__label">Room Name Style</span>
            <div className="style-options">
              <label className={`style-option ${roomNameStyle === 'standard' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="roomNameStyle"
                  value="standard"
                  checked={roomNameStyle === 'standard'}
                  onChange={(e) => setRoomNameStyle(e.target.value)}
                />
                Bold
              </label>
              <label className={`style-option ${roomNameStyle === 'italic' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="roomNameStyle"
                  value="italic"
                  checked={roomNameStyle === 'italic'}
                  onChange={(e) => setRoomNameStyle(e.target.value)}
                />
                Italic
              </label>
            </div>
          </div>
        )}
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
          <button type="button" onClick={exportPNG} className="export-btn">
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
