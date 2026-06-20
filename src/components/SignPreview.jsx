import React, { useRef, useState } from 'react'
import { SignArtwork } from '../sign/SignArtwork'
import { BLEED_INCHES } from '../sign/signConstants'
import { resolveSignValues } from '../sign/signDefaults'
import { resolveCardHolderGeometry } from '../sign/signGeometry'
import { exportSignPNG, exportSignPDF } from '../sign/signExport'
import { getDepartmentDisplayName } from '../unbc'
import { SignStyleControls } from './SignStyleControls'
import { SignExportControls } from './SignExportControls'
import { PreviewMeasurements } from './PreviewMeasurements'

const ROOM_TYPES = ['lab', 'general-room', 'custodian-closet']

export const SignPreview = ({ signData, cardHolders }) => {
  const signRef = useRef(null)
  const [paperSize, setPaperSize] = useState('letter')
  const [headlineWeight, setHeadlineWeight] = useState('bold')
  const [roomNameStyle, setRoomNameStyle] = useState('standard')
  const [showGuides, setShowGuides] = useState(true)

  const selectedCardHolder = signData.cardHolderType ? cardHolders[signData.cardHolderType] : null
  const { insertSize, previewFrameStyle, measurementSummary } = resolveCardHolderGeometry(selectedCardHolder)

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
    email: values.email,
    phone: values.phone,
    showEmail: signData.showEmail,
    showPhone: signData.showPhone,
    roomName: values.roomName,
    showAlumni: shouldShowAlumni,
    headlineWeight,
    roomNameStyle,
    insert: insertSize,
    bleed: BLEED_INCHES
  }

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
            <span className="preview-legend__item preview-legend__item--safe">Safe area</span>
            {selectedCardHolder && (
              <span className="preview-legend__item preview-legend__item--holder">Holder window</span>
            )}
          </div>
        )}

        <PreviewMeasurements
          selectedCardHolder={selectedCardHolder}
          measurementSummary={measurementSummary}
        />
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
      />
    </>
  )
}
