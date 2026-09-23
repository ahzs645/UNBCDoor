import React, { useEffect, useState } from 'react'
import { SignForm } from './components/SignForm'
import { SignPreview } from './components/SignPreview'
import { CardHolderSelector } from './components/CardHolderSelector'
import { ToggleButtons } from './components/ToggleButtons'
import { DesignationsContainer } from './components/DesignationsContainer'
import { ThemeToggle } from './components/ThemeToggle'
import { SignArchiveControls } from './components/SignArchiveControls'
import { MeasuringSheetsPage } from './components/MeasuringSheetsPage'
import { LivePreview } from './components/LivePreview'
import { useCardHolders } from './hooks/useCardHolders'
import { useSignState } from './hooks/useSignState'
import { useTheme } from './hooks/useTheme'
import { useMediaQuery } from './hooks/useMediaQuery'
import { departmentTypes } from '@unbc/logo'

const EDITOR_PATH = import.meta.env.BASE_URL
const SAVED_SIGNS_PATH = `${import.meta.env.BASE_URL}saved-signs/`
const MEASURING_SHEETS_PATH = `${import.meta.env.BASE_URL}measuring-sheets/`

const PAGE_PATHS = {
  editor: EDITOR_PATH,
  'saved-signs': SAVED_SIGNS_PATH,
  'measuring-sheets': MEASURING_SHEETS_PATH
}

const LIVE_PREVIEW_KEY = 'unbc-door-sign:live-preview-hidden'

// Remembered per browser; storage can be unavailable (private mode, blocked site data), in
// which case the live preview simply starts visible.
const readLivePreviewHidden = () => {
  try {
    return window.localStorage.getItem(LIVE_PREVIEW_KEY) === 'true'
  } catch (error) {
    return false
  }
}

const pageFromPath = () => {
  const path = window.location.pathname.replace(/\/+$/, '')
  if (path.endsWith('/saved-signs')) return 'saved-signs'
  if (path.endsWith('/measuring-sheets')) return 'measuring-sheets'
  return 'editor'
}

function App() {
  const [signData, setSignData] = useSignState()
  const { cardHolders } = useCardHolders()
  const { isDarkMode, toggleTheme } = useTheme()
  const [activeMobileTab, setActiveMobileTab] = useState('editor')
  const [livePreviewHidden, setLivePreviewHidden] = useState(readLivePreviewHidden)
  // Matches the tabbed layout breakpoint in responsive.css.
  const isTabbedLayout = useMediaQuery('(max-width: 1024px)')
  const [page, setPage] = useState(pageFromPath)

  const updateSignData = (updates) => {
    setSignData(prev => ({ ...prev, ...updates }))
  }

  useEffect(() => {
    const handlePopState = () => setPage(pageFromPath())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const updateLivePreviewHidden = (hidden) => {
    setLivePreviewHidden(hidden)
    try {
      window.localStorage.setItem(LIVE_PREVIEW_KEY, String(hidden))
    } catch (error) {
      // Not remembered this time; the choice still applies for this visit.
    }
  }

  const showPreviewTab = () => {
    setActiveMobileTab('preview')
    window.scrollTo({ top: 0 })
  }

  const navigateTo = (nextPage, event) => {
    if (event) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
    }

    window.history.pushState({}, '', PAGE_PATHS[nextPage] || EDITOR_PATH)
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div className="container" hidden={page !== 'editor'}>
        {/* Phones and tablets: the editor and the full preview are tabs, and a live copy of the
            sign stays pinned above the form while editing. Hidden on desktop by CSS. */}
        <div className="mobile-editor-bar">
          <div className="mobile-editor-tabs" role="tablist" aria-label="Editor and preview">
            <button
              type="button"
              role="tab"
              aria-selected={activeMobileTab === 'editor'}
              aria-controls="editor-panel"
              className={`mobile-editor-tab ${activeMobileTab === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveMobileTab('editor')}
            >
              Editor
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMobileTab === 'preview'}
              aria-controls="preview-panel"
              className={`mobile-editor-tab ${activeMobileTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveMobileTab('preview')}
            >
              Preview
            </button>
          </div>
          {isTabbedLayout && activeMobileTab === 'editor' && (
            livePreviewHidden ? (
              <button
                type="button"
                className="live-preview-show"
                onClick={() => updateLivePreviewHidden(false)}
              >
                Show live preview
              </button>
            ) : (
              <LivePreview
                signData={signData}
                cardHolders={cardHolders}
                onOpenPreview={showPreviewTab}
                onHide={() => updateLivePreviewHidden(true)}
              />
            )
          )}
        </div>

        <div
          id="editor-panel"
          role="tabpanel"
          className={`controls mobile-tab-panel ${activeMobileTab === 'editor' ? 'active' : ''}`}
        >
          <div className="controls-header">
            <h1>UNBC Door Sign Generator</h1>
            <div className="controls-header__actions">
              <a
                className="app-page-link"
                href={MEASURING_SHEETS_PATH}
                onClick={(event) => navigateTo('measuring-sheets', event)}
              >
                Measuring sheets
              </a>
              <a
                className="app-page-link"
                href={SAVED_SIGNS_PATH}
                onClick={(event) => navigateTo('saved-signs', event)}
              >
                Saved signs
              </a>
              <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
            </div>
          </div>
          <SignForm
            signData={signData}
            onUpdate={updateSignData}
            departments={departmentTypes}
          />

          <ToggleButtons
            signType={signData.signType}
            showAlumni={signData.showAlumni}
            showAlumni2={signData.showAlumni2}
            showSecondOccupant={signData.showSecondOccupant}
            occupantName={signData.name}
            occupantName2={signData.name2}
            showDesignations={signData.showDesignations}
            onToggleAlumni={() => updateSignData({ showAlumni: !signData.showAlumni })}
            onToggleAlumni2={() => updateSignData({ showAlumni2: !signData.showAlumni2 })}
            onToggleDesignations={() => updateSignData({ showDesignations: !signData.showDesignations })}
          />

          {signData.showDesignations && (signData.signType === 'faculty' || signData.signType === 'staff') && (
            <DesignationsContainer
              selectedDesignations={signData.designations}
              onUpdate={(designations) => updateSignData({ designations })}
            />
          )}
        </div>

        <div
          id="preview-panel"
          role="tabpanel"
          className={`card-holder-selector-container mobile-tab-panel ${activeMobileTab === 'preview' ? 'active' : ''}`}
        >
          <CardHolderSelector
            cardHolders={cardHolders}
            selectedType={signData.cardHolderType}
            onUpdate={(cardHolderType) => updateSignData({ cardHolderType })}
          />

          <SignPreview
            signData={signData}
            cardHolders={cardHolders}
            onUpdate={updateSignData}
            measuringSheetsHref={MEASURING_SHEETS_PATH}
            onOpenMeasuringSheets={(event) => navigateTo('measuring-sheets', event)}
          />

        </div>
      </div>

      <main className="saved-signs-page measuring-sheets-page" hidden={page !== 'measuring-sheets'}>
        <section className="saved-signs-card">
          <div className="controls-header">
            <h1>Measuring sheets</h1>
            <div className="controls-header__actions">
              <a
                className="app-page-link"
                href={EDITOR_PATH}
                onClick={(event) => navigateTo('editor', event)}
              >
                Back to editor
              </a>
              <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
            </div>
          </div>
          <p className="measuring-sheets__intro">
            Printable sheets for checking a door sign holder against its preset — or for
            measuring one that has no preset yet. Configure a sheet, watch it redraw, then
            print it at 100%.
          </p>
          {/* Mounted only while the page is open so the preview isn't rebuilding a PDF in the
              background the whole time the editor is in use. */}
          {page === 'measuring-sheets' && (
            <MeasuringSheetsPage cardHolders={cardHolders} initialHolderKey={signData.cardHolderType || ''} />
          )}
        </section>
      </main>

      <main className="saved-signs-page" hidden={page !== 'saved-signs'}>
        <section className="saved-signs-card">
          <div className="controls-header">
            <h1>UNBC Door Sign Generator</h1>
            <div className="controls-header__actions">
              <a
                className="app-page-link"
                href={EDITOR_PATH}
                onClick={(event) => navigateTo('editor', event)}
              >
                Back to editor
              </a>
              <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
            </div>
          </div>
          <SignArchiveControls
            signData={signData}
            onLoadSign={(loadedSign) => setSignData(loadedSign)}
            onEditSign={(event) => navigateTo('editor', event)}
          />
        </section>
      </main>
    </>
  )
}

export default App
