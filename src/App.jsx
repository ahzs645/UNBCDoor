import React, { useEffect, useMemo, useState } from 'react'
import { SignForm } from './components/SignForm'
import { SignPreview } from './components/SignPreview'
import { CredentialsSection } from './components/CredentialsSection'
import { SignStyleControls } from './components/SignStyleControls'
import { AppHeader } from './components/AppHeader'
import { SavedSignsBrowser } from './components/SavedSignsBrowser'
import { ArchiveNavigator } from './components/ArchiveNavigator'
import { MeasuringSheetsPage } from './components/MeasuringSheetsPage'
import { LivePreview } from './components/LivePreview'
import { useCardHolders } from './hooks/useCardHolders'
import { useSignState } from './hooks/useSignState'
import { useSignArchive } from './hooks/useSignArchive'
import { useTheme } from './hooks/useTheme'
import { useMediaQuery } from './hooks/useMediaQuery'
import { buildSignContent } from './sign/signContent'
import { readSignFromUrl, removeSignShareToken } from './sign/signShare'
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

// Matches the single-column breakpoint in responsive.css.
const COMPACT_QUERY = '(max-width: 959px)'

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

const EditIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16v4z" />
    <path d="m13.5 6.5 4 4" />
  </svg>
)

const PreviewIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 9h18" />
    <path d="M7 13h6M7 16h4" />
  </svg>
)

function App() {
  const [signData, setSignData] = useSignState()
  const { cardHolders, builtInHolderNames, saveCustomHolder, deleteCustomHolder } = useCardHolders()
  const { isDarkMode, toggleTheme } = useTheme()
  const [activeMobileTab, setActiveMobileTab] = useState('editor')
  const [livePreviewHidden, setLivePreviewHidden] = useState(readLivePreviewHidden)
  const isCompactLayout = useMediaQuery(COMPACT_QUERY)
  const [page, setPage] = useState(pageFromPath)
  const archiveState = useSignArchive(signData, setSignData)

  // Single source of truth for the artwork — the preview, both exporters and the appearance
  // panel (which only offers options that act on what is actually on the card) all read it.
  const signContent = useMemo(
    () => buildSignContent(signData, { cardHolders }),
    [signData, cardHolders]
  )

  const updateSignData = (updates) => {
    setSignData(prev => ({ ...prev, ...updates }))
  }

  // Share links (#sign=…) open into the editor: on first load, and when a link is pasted into a
  // tab that is already open. The token is then dropped from the address bar so it doesn't keep
  // pointing at the original once the sign is edited.
  const [shareNotice, setShareNotice] = useState(null)
  const { deselect: deselectArchiveEntry } = archiveState

  useEffect(() => {
    let cancelled = false

    const openSharedSign = async () => {
      const href = window.location.href
      const result = await readSignFromUrl(href)
      if (!result || cancelled) return

      if (result.signData) {
        // A shared sign isn't one of the open archive's entries; keep it from overwriting one.
        deselectArchiveEntry()
        setSignData(result.signData)
        setPage('editor')
        window.history.replaceState(window.history.state, '', removeSignShareToken(new URL(EDITOR_PATH, href).href))
        setShareNotice({ kind: 'success', text: 'Opened a shared sign. Your changes stay on this device until you export or share them.' })
      } else {
        window.history.replaceState(window.history.state, '', removeSignShareToken(href))
        setShareNotice({
          kind: 'error',
          text: 'This share link couldn’t be opened — it may have been cut off when it was copied. Ask for the link again.'
        })
      }
    }

    openSharedSign()
    window.addEventListener('hashchange', openSharedSign)
    return () => {
      cancelled = true
      window.removeEventListener('hashchange', openSharedSign)
    }
  }, [])

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

  const showMobileTab = (tab) => {
    if (tab === activeMobileTab) return
    setActiveMobileTab(tab)
    window.scrollTo({ top: 0 })
  }

  const navigateTo = (nextPage, event) => {
    if (event) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
    }

    window.history.pushState({}, '', PAGE_PATHS[nextPage] || EDITOR_PATH)
    setPage(nextPage)
    window.scrollTo({ top: 0 })
  }

  const header = (
    <AppHeader
      page={page}
      paths={PAGE_PATHS}
      onNavigate={navigateTo}
      archiveCount={archiveState.archive ? archiveState.signs.length : 0}
      isDarkMode={isDarkMode}
      onToggleTheme={toggleTheme}
    />
  )

  return (
    <>
      {header}

      <main
        className={`workspace workspace--${activeMobileTab}`}
        hidden={page !== 'editor'}
        aria-labelledby="editor-title"
      >
        <h1 className="visually-hidden" id="editor-title">UNBC Door Sign Generator</h1>

        {/* Phones and tablets: a live copy of the sign stays pinned above the form, so every
            edit is visible without switching to the Preview tab. Desktop shows the full preview
            beside the form instead. */}
        {isCompactLayout && activeMobileTab === 'editor' && (
          livePreviewHidden ? (
            <div className="live-preview-bar">
              <button
                type="button"
                className="live-preview-show"
                onClick={() => updateLivePreviewHidden(false)}
              >
                Show live preview
              </button>
            </div>
          ) : (
            <LivePreview
              signData={signData}
              cardHolders={cardHolders}
              onOpenPreview={() => showMobileTab('preview')}
              onHide={() => updateLivePreviewHidden(true)}
            />
          )
        )}

        <div
          id="editor-panel"
          className="workspace__form"
          role={isCompactLayout ? 'tabpanel' : undefined}
          aria-label="Sign details"
        >
          {shareNotice && (
            <div className={`share-notice share-notice--${shareNotice.kind}`} role="status">
              <p>{shareNotice.text}</p>
              <button type="button" className="share-notice__dismiss" onClick={() => setShareNotice(null)} aria-label="Dismiss">
                ×
              </button>
            </div>
          )}

          <ArchiveNavigator
            archiveState={archiveState}
            browseHref={SAVED_SIGNS_PATH}
            onBrowse={(event) => navigateTo('saved-signs', event)}
          />

          <SignForm
            signData={signData}
            onUpdate={updateSignData}
            departments={departmentTypes}
          />

          <CredentialsSection signData={signData} onUpdate={updateSignData} />

          {/* Appearance sits with the content it restyles; on desktop the preview stays in
              view beside it, and on phones the pinned live preview does the same job. */}
          <SignStyleControls signData={signData} content={signContent} onUpdate={updateSignData} />
        </div>

        <div
          id="preview-panel"
          className="workspace__output"
          role={isCompactLayout ? 'tabpanel' : undefined}
          aria-label="Preview and export"
        >
          <SignPreview
            signData={signData}
            content={signContent}
            cardHolders={cardHolders}
            builtInHolderNames={builtInHolderNames}
            onSaveCustomHolder={saveCustomHolder}
            onDeleteCustomHolder={deleteCustomHolder}
            onUpdate={updateSignData}
            archiveState={archiveState}
            editorHref={EDITOR_PATH}
            measuringSheetsHref={MEASURING_SHEETS_PATH}
            onOpenMeasuringSheets={(event) => navigateTo('measuring-sheets', event)}
          />
        </div>

        {/* Thumb-reach switch between editing and the full preview with the export buttons. */}
        {isCompactLayout && (
          <nav className="mobile-dock" aria-label="Editor views">
            <div className="mobile-dock__tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeMobileTab === 'editor'}
                aria-controls="editor-panel"
                className={`mobile-dock__tab ${activeMobileTab === 'editor' ? 'active' : ''}`}
                onClick={() => showMobileTab('editor')}
              >
                <EditIcon />
                Edit
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeMobileTab === 'preview'}
                aria-controls="preview-panel"
                className={`mobile-dock__tab ${activeMobileTab === 'preview' ? 'active' : ''}`}
                onClick={() => showMobileTab('preview')}
              >
                <PreviewIcon />
                Preview &amp; export
              </button>
            </div>
          </nav>
        )}
      </main>

      <main className="page page--measuring-sheets" hidden={page !== 'measuring-sheets'}>
        <section className="page-card">
          <div className="page-card__header">
            <h1>Measuring sheets</h1>
            <p className="page-card__intro">
              Printable sheets for checking a door sign holder against its preset — or for
              measuring one that has no preset yet. Configure a sheet, watch it redraw, then
              print it at 100%.
            </p>
          </div>
          {/* Mounted only while the page is open so the preview isn't rebuilding a PDF in the
              background the whole time the editor is in use. */}
          {page === 'measuring-sheets' && (
            <MeasuringSheetsPage
              cardHolders={cardHolders}
              initialHolderKey={signData.cardHolderType || ''}
              onSaveCustomHolder={saveCustomHolder}
            />
          )}
        </section>
      </main>

      <main className="page page--saved-signs" hidden={page !== 'saved-signs'}>
        <section className="page-card">
          <div className="page-card__header">
            <h1>Saved signs</h1>
          </div>
          <SavedSignsBrowser
            archiveState={archiveState}
            cardHolders={cardHolders}
            editorHref={EDITOR_PATH}
            onEditSign={(event) => navigateTo('editor', event)}
          />
        </section>
      </main>
    </>
  )
}

export default App
