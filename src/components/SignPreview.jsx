import React, { useRef, useState } from 'react'
import { jsPDF } from 'jspdf'
import { svg2pdf } from 'svg2pdf.js'
import { SignArtwork } from '../sign/SignArtwork'
import { registerArtworkFonts, ARTWORK_ITALIC_FAMILY, ARTWORK_BLACK_FAMILY } from '../sign/pdfFonts'
import { getDepartmentDisplayName } from '../unbc'

const PT_PER_INCH = 72

// Print production constants (inches). Bleed is the industry-standard 1/8"; the safe area
// keeps critical content clear of the cut. Both are used by the preview guides and the PDF.
const BLEED_INCHES = 0.125
const SAFE_INCHES = 0.125

export const SignPreview = ({ signData, cardHolders }) => {
  const signRef = useRef(null)
  const [paperSize, setPaperSize] = useState('letter')
  const [headlineWeight, setHeadlineWeight] = useState('bold')
  const [roomNameStyle, setRoomNameStyle] = useState('standard')
  const [showGuides, setShowGuides] = useState(true)
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

  // Canvas = trim insert + bleed on every edge. The preview frame matches this canvas, and
  // the trim / safe / holder guides are inset back in as a fraction of the canvas.
  const canvasWidth = insertSize.width + BLEED_INCHES * 2
  const canvasHeight = insertSize.height + BLEED_INCHES * 2
  const aspectRatio = canvasWidth / canvasHeight

  const bleedFracX = (BLEED_INCHES / canvasWidth) * 100
  const bleedFracY = (BLEED_INCHES / canvasHeight) * 100
  const safeFracX = (SAFE_INCHES / canvasWidth) * 100
  const safeFracY = (SAFE_INCHES / canvasHeight) * 100

  const previewFrameStyle = {
    '--sign-aspect': aspectRatio,
    '--bleed-x': `${bleedFracX}%`,
    '--bleed-y': `${bleedFracY}%`,
    '--safe-x': `${safeFracX}%`,
    '--safe-y': `${safeFracY}%`,
    // Holder bars are measured against the trim insert, so they live inside the trim box.
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
    insert: insertSize,
    bleed: BLEED_INCHES
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

    const bleedPt = BLEED_INCHES * PT_PER_INCH
    const trimW = insertSize.width * PT_PER_INCH
    const trimH = insertSize.height * PT_PER_INCH

    // Rasterize the artwork as-authored (keeps font-style italic for the browser to render).
    const clone = source.cloneNode(true)
    clone.setAttribute('width', viewW)
    clone.setAttribute('height', viewH)

    const xml = new XMLSerializer().serializeToString(clone)
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`
    const scale = 4

    const image = new Image()
    image.onload = () => {
      // The PNG is the finished, trimmed insert — crop the bleed margin back off so it
      // matches what you get after cutting (the PDF keeps the bleed for the printer).
      const canvas = document.createElement('canvas')
      canvas.width = trimW * scale
      canvas.height = trimH * scale
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(
        image,
        bleedPt, bleedPt, trimW, trimH,
        0, 0, canvas.width, canvas.height
      )

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

      // The artwork carries bleed on every edge; crop marks below pin the trim (cut) line.
      const bleedPt = BLEED_INCHES * PT_PER_INCH
      const trimW = insertSize.width * PT_PER_INCH
      const trimH = insertSize.height * PT_PER_INCH
      const artWidth = trimW + bleedPt * 2
      const artHeight = trimH + bleedPt * 2
      const pageWidth = paper.width * PT_PER_INCH
      const pageHeight = paper.height * PT_PER_INCH
      // Center the TRIM box on the page; bleed extends outward from there. When the insert
      // is as wide as the sheet (e.g. 8.5" insert on Letter) the side bleed falls off the
      // page — expected, since the trim edge is then the paper edge.
      const xOffset = (pageWidth - trimW) / 2 - bleedPt
      const yOffset = (pageHeight - trimH) / 2 - bleedPt

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

      // Vector crop marks aligned to the trim (cut) line, sitting in the margin just
      // outside the bleed so they never print on the live artwork (0.25" arms).
      const mark = 0.25 * PT_PER_INCH
      const ax0 = xOffset                 // artwork (bleed) edges
      const ay0 = yOffset
      const ax1 = xOffset + artWidth
      const ay1 = yOffset + artHeight
      const tx0 = xOffset + bleedPt        // trim (cut) lines
      const ty0 = yOffset + bleedPt
      const tx1 = ax1 - bleedPt
      const ty1 = ay1 - bleedPt

      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.75)

      // Horizontal arms in the left/right margins, aligned to the trim top & bottom.
      doc.line(ax0 - mark, ty0, ax0, ty0)
      doc.line(ax1, ty0, ax1 + mark, ty0)
      doc.line(ax0 - mark, ty1, ax0, ty1)
      doc.line(ax1, ty1, ax1 + mark, ty1)

      // Vertical arms in the top/bottom margins, aligned to the trim left & right.
      doc.line(tx0, ay0 - mark, tx0, ay0)
      doc.line(tx1, ay0 - mark, tx1, ay0)
      doc.line(tx0, ay1, tx0, ay1 + mark)
      doc.line(tx1, ay1, tx1, ay1 + mark)

      doc.save(`unbc-door-sign-${signData.signType || 'custom'}.pdf`)
    } catch (error) {
      console.error('Error exporting PDF:', error)
    }
  }

  const measurementSummary = [
    {
      label: 'Print (with bleed)',
      value: `${formatInches(canvasWidth)}" × ${formatInches(canvasHeight)}"`
    },
    {
      label: 'Trim / insert',
      value: `${formatInches(insertSize.width)}" × ${formatInches(insertSize.height)}"`
    },
    ...(selectedCardHolder ? [{
      label: 'Viewable',
      value: `${formatInches(viewableSize.width)}" × ${formatInches(viewableSize.height)}"`
    }] : [])
  ]

  return (
    <>
      <div className="preview">
        <div className="preview-toolbar">
          <span className="preview-toolbar__title">Preview</span>
          <label className="switch preview-guide-toggle">
            <input
              type="checkbox"
              checked={showGuides}
              onChange={(e) => setShowGuides(e.target.checked)}
            />
            <span className="switch__track" aria-hidden="true" />
            <span className="switch__text">Print guides</span>
          </label>
        </div>

        <div
          className={`preview-frame ${selectedCardHolder ? 'with-holder' : 'without-holder'} ${showGuides ? 'show-guides' : ''}`}
          style={previewFrameStyle}
        >
          <div className={doorSignClass}>
            <SignArtwork ref={signRef} content={signContent} />
          </div>

          {showGuides && (
            <>
              <span className="print-guide print-trim" aria-hidden="true" />
              <span className="print-guide print-safe" aria-hidden="true" />
            </>
          )}

          {selectedCardHolder && (
            <div className="card-holder-frame" aria-hidden="true">
              <div className="card-holder-overlay">
                <span className="card-holder-bar top" />
                <span className="card-holder-bar bottom" />
                <span className="card-holder-bar left" />
                <span className="card-holder-bar right" />
              </div>
            </div>
          )}
        </div>

        {showGuides && (
          <div className="preview-legend" aria-hidden="true">
            <span className="preview-legend__item preview-legend__item--bleed">Bleed</span>
            <span className="preview-legend__item preview-legend__item--trim">Trim / cut line</span>
            <span className="preview-legend__item preview-legend__item--safe">Safe area</span>
            {selectedCardHolder && (
              <span className="preview-legend__item preview-legend__item--holder">Holder window</span>
            )}
          </div>
        )}

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
