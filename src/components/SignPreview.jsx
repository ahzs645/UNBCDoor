import React, { useRef, useState } from 'react'
import { SignArtwork } from '../sign/SignArtwork'
import { BLEED_INCHES } from '../sign/signConstants'
import { resolveSignValues } from '../sign/signDefaults'
import { resolveCardHolderGeometry, getPrintLayout } from '../sign/signGeometry'
import { exportSignPNG, exportSignPDF } from '../sign/signExport'
import { getDepartmentDisplayName } from '../unbc'
import { SignStyleControls } from './SignStyleControls'
import { SignExportControls } from './SignExportControls'
import { PreviewMeasurements } from './PreviewMeasurements'

const ROOM_TYPES = ['lab', 'general-room', 'custodian-closet']

// Turns the print-fit result into a one-line caution shown above the export buttons. Returns
// null when the insert + bleed + crop marks all fit the chosen sheet at the required 1:1 scale.
const buildFitWarning = (layout) => {
  if (layout.fitsMarks) return null
  const target = layout.recommendedPaperLabel
  if (!layout.fitsBleed) {
    return target
      ? `This insert is larger than the selected sheet and will be clipped. Switch to ${target} to print it full-size with crop marks.`
      : 'This insert is too large for the available sheets — print it at a commercial printer.'
  }
  return target
    ? `The artwork fits, but there's no room for crop marks on this sheet. Switch to ${target} for crop marks, or cut to the insert size by hand.`
    : "There's no room for crop marks on this sheet; cut to the insert size by hand."
}

export const SignPreview = ({ signData, cardHolders }) => {
  const signRef = useRef(null)
  const [paperSize, setPaperSize] = useState('letter')
  const [headlineWeight, setHeadlineWeight] = useState('bold')
  const [roomNameStyle, setRoomNameStyle] = useState('standard')
  const [showGuides, setShowGuides] = useState(true)

  const selectedCardHolder = signData.cardHolderType ? cardHolders[signData.cardHolderType] : null
  const { insertSize, viewableOffset, previewFrameStyle, measurementSummary } = resolveCardHolderGeometry(selectedCardHolder)

  const values = resolveSignValues(signData)
  const shouldShowAlumni = (signData.signType === 'faculty' || signData.signType === 'staff') && signData.showAlumni
  const isRoomType = ROOM_TYPES.includes(signData.signType)

  const doorSignClass = [
    'door-sign',
    signData.signType || 'faculty',
    selectedCardHolder ? 'with-holder' : ''
  ].filter(Boolean).join(' ')

  // Single source of truth for the artwork — used by the preview and both exporters.
  const signContent = {
    signType: signData.signType || 'faculty',
    departmentText: getDepartmentDisplayName(signData),
    name: values.name,
    credentials: (signData.showDesignations && signData.designations?.length > 0)
      ? signData.designations.join(', ')
      : '',
    position: values.position,
    tagline: values.tagline,
    email: values.email,
    phone: values.phone,
    cellPhone: values.cellPhone,
    showEmail: signData.showEmail,
    showPhone: signData.showPhone,
    showCellPhone: signData.showCellPhone,
    roomName: values.roomName,
    contactName: values.contactName,
    showSecondOccupant: signData.showSecondOccupant,
    name2: values.name2,
    position2: values.position2,
    tagline2: values.tagline2,
    email2: values.email2,
    phone2: values.phone2,
    cellPhone2: values.cellPhone2,
    showEmail2: signData.showEmail2,
    showPhone2: signData.showPhone2,
    showCellPhone2: signData.showCellPhone2,
    roomName2: values.roomName2,
    contactName2: values.contactName2,
    showAlumni: shouldShowAlumni,
    headlineWeight,
    roomNameStyle,
    insert: insertSize,
    viewable: viewableOffset,
    bleed: BLEED_INCHES
  }

  const printLayout = getPrintLayout({ insertSize, paperSize })
  const fitWarning = buildFitWarning(printLayout)

  const handleExportPNG = () => exportSignPNG(signRef.current, { insertSize })
  const handleExportPDF = () => exportSignPDF(signRef.current, {
    insertSize,
    paperSize,
    signType: signData.signType
  })

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
            {selectedCardHolder ? (
              <span className="preview-legend__item preview-legend__item--holder">Holder window (safe area)</span>
            ) : (
              <span className="preview-legend__item preview-legend__item--safe">Safe area</span>
            )}
          </div>
        )}

        <PreviewMeasurements measurementSummary={measurementSummary} />
      </div>

      <SignStyleControls
        headlineWeight={headlineWeight}
        onHeadlineWeightChange={setHeadlineWeight}
        roomNameStyle={roomNameStyle}
        onRoomNameStyleChange={setRoomNameStyle}
        isRoomType={isRoomType}
      />

      <SignExportControls
        paperSize={paperSize}
        onPaperSizeChange={setPaperSize}
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
        fitWarning={fitWarning}
      />
    </>
  )
}
