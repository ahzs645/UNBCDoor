import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import archive from './generated-manifest.json'
import { SignArtwork } from '../../src/sign/SignArtwork'
import { normalizeSignData } from '../../src/sign/signArchive'
import { buildSignContent } from '../../src/sign/signContent'
import { cardHolders } from '../../src/data/cardHolders'
import '../../src/styles/fonts.css'
import './viewer.css'

// The review renders the trimmed card (no bleed) so it lines up with the source artboards.
const buildContent = (rawSignData, contentSizeOverride) => {
  const signData = normalizeSignData(rawSignData)
  return {
    ...buildSignContent(signData, { cardHolders, bleed: 0 }),
    contentSize: contentSizeOverride || signData.contentSize
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
