import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import archive from './generated-manifest.json'
import { SignArtwork } from '../../src/sign/SignArtwork'
import { normalizeSignData } from '../../src/sign/signArchive'
import { resolveSignValues } from '../../src/sign/signDefaults'
import { resolveCardHolderGeometry } from '../../src/sign/signGeometry'
import { cardHolders } from '../../src/data/cardHolders'
import { getDepartmentDisplayName } from '../../src/unbc'
import '../../src/styles/fonts.css'
import './viewer.css'

const buildContent = (rawSignData, contentSizeOverride) => {
  const signData = normalizeSignData(rawSignData)
  const values = resolveSignValues(signData)
  const selectedHolder = cardHolders[signData.cardHolderType]
  const { insertSize, viewableOffset } = resolveCardHolderGeometry(selectedHolder)
  const supportsAlumni = signData.signType === 'faculty' || signData.signType === 'staff'

  return {
    signType: signData.signType,
    departmentText: getDepartmentDisplayName(signData),
    name: values.name,
    credentials: signData.showDesignations && signData.designations.length
      ? signData.designations.join(', ')
      : '',
    position: values.position,
    tagline: values.tagline,
    email: values.email,
    emailLabel: signData.emailLabel,
    phone: values.phone,
    phoneLabel: signData.phoneLabel,
    cellPhone: values.cellPhone,
    cellPhoneLabel: signData.cellPhoneLabel,
    showEmail: signData.showEmail,
    showPhone: signData.showPhone,
    showCellPhone: signData.showCellPhone,
    roomName: values.roomName,
    contactName: values.contactName,
    showSecondOccupant: signData.showSecondOccupant,
    secondaryEntryType: signData.secondaryEntryType,
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
    showAlumni: supportsAlumni && signData.showAlumni,
    showAlumni2: supportsAlumni && signData.showAlumni2,
    headlineWeight: signData.headlineWeight,
    roomNameStyle: signData.roomNameStyle,
    positionLayout: signData.positionLayout,
    positionSize: signData.positionSize,
    designationLayout: signData.designationLayout,
    twoPersonSpacing: signData.twoPersonSpacing,
    contentSize: contentSizeOverride || signData.contentSize,
    contentSpacing: signData.contentSpacing,
    contentWidth: signData.contentWidth,
    textAlignment: signData.textAlignment,
    contactLayout: signData.contactLayout,
    contactSize: signData.contactSize,
    bodyTextMode: signData.bodyTextMode,
    roomContactGrouping: signData.roomContactGrouping,
    organizationLogo: signData.organizationLogo,
    insert: insertSize,
    viewable: viewableOffset,
    bleed: 0
  }
}

const App = () => {
  const initialIndex = Math.max(0, archive.signs.findIndex(item => item.id === window.location.hash.slice(1)))
  const [index, setIndex] = useState(initialIndex)
  const [mode, setMode] = useState('side')
  const selected = archive.signs[index]
  const normalized = useMemo(() => normalizeSignData(selected.signData), [selected])
  const [contentSize, setContentSize] = useState(normalized.contentSize)
  const content = useMemo(() => buildContent(selected.signData, contentSize), [selected, contentSize])
  const referenceAspect = selected.referenceWidth / selected.referenceHeight

  useEffect(() => {
    setContentSize(normalized.contentSize)
    window.location.hash = selected.id
  }, [selected, normalized.contentSize])

  useEffect(() => {
    const handleKey = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return
      if (event.key === 'ArrowLeft') setIndex(value => (value - 1 + archive.signs.length) % archive.signs.length)
      if (event.key === 'ArrowRight') setIndex(value => (value + 1) % archive.signs.length)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const move = (amount) => setIndex(value => (value + amount + archive.signs.length) % archive.signs.length)
  const stageStyle = { aspectRatio: referenceAspect }

  return (
    <div className="review-app">
      <header className="review-header">
        <div className="review-header__title">
          <strong>UNBC Door Sign Archive Review</strong>
          <span>{index + 1} / {archive.signs.length}</span>
        </div>
        <select value={index} onChange={(event) => setIndex(Number(event.target.value))} aria-label="Choose sign">
          {archive.signs.map((item, itemIndex) => (
            <option key={item.id} value={itemIndex}>{itemIndex + 1}. {item.label}</option>
          ))}
        </select>
        <div className="review-navigation">
          <button type="button" onClick={() => move(-1)}>Previous</button>
          <button type="button" onClick={() => move(1)}>Next</button>
        </div>
      </header>

      <main>
        <section className="review-toolbar">
          <div>
            <h1>{selected.label}</h1>
            <p>{selected.source}</p>
          </div>
          <div className="segmented" aria-label="Comparison view">
            <button type="button" className={mode === 'side' ? 'active' : ''} onClick={() => setMode('side')}>Side by side</button>
            <button type="button" className={mode === 'overlay' ? 'active' : ''} onClick={() => setMode('overlay')}>Overlay</button>
          </div>
          <div className="segmented" aria-label="Preview content size">
            <span>Content size</span>
            <button type="button" className={contentSize === 'standard' ? 'active' : ''} onClick={() => setContentSize('standard')}>Standard</button>
            <button type="button" className={contentSize === 'large' ? 'active' : ''} onClick={() => setContentSize('large')}>Larger</button>
            <button type="button" className={contentSize === 'largest' ? 'active' : ''} onClick={() => setContentSize('largest')}>Largest</button>
          </div>
        </section>

        {mode === 'side' ? (
          <section className="comparison-grid">
            <article className="comparison-card">
              <h2>Source AI / PDF</h2>
              <div className="sign-stage" style={stageStyle}>
                <img src={selected.referenceImage} alt={`Source artwork for ${selected.label}`} />
              </div>
            </article>
            <article className="comparison-card">
              <h2>Current generator</h2>
              <div className="sign-stage candidate-stage" style={stageStyle}>
                <SignArtwork content={content} />
              </div>
            </article>
          </section>
        ) : (
          <section className="comparison-card overlay-card">
            <h2>50% overlay</h2>
            <div className="sign-stage overlay-stage" style={stageStyle}>
              <img src={selected.referenceImage} alt={`Overlay source for ${selected.label}`} />
              <div className="overlay-candidate"><SignArtwork content={content} /></div>
            </div>
          </section>
        )}

        <footer>
          <span><strong>Archive setting:</strong> {{ standard: 'Standard', large: 'Larger', largest: 'Largest' }[normalized.contentSize]}</span>
          <span><strong>Source:</strong> {selected.sourcePath}</span>
          <span>Use Previous/Next, the picker, or left/right arrow keys.</span>
        </footer>
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
