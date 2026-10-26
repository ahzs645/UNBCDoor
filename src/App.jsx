import React, { useEffect, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { ShareLinkButton } from './components/ShareLinkButton'
import { useTheme } from './hooks/useTheme'
import { readSignFromUrl, removeSignShareToken } from './sign/signShare'
import { DoorSignEditor, MeasuringSheetsPage, SavedSignsBrowser, switchOrganization, useDoorSign } from '../vendor/door-sign/src/index.js'
import productionArchive from '../data/door-sign-archive.json'

const EDITOR_PATH = import.meta.env.BASE_URL
const SAVED_SIGNS_PATH = `${import.meta.env.BASE_URL}saved-signs/`
const MEASURING_SHEETS_PATH = `${import.meta.env.BASE_URL}measuring-sheets/`

const PAGE_PATHS = {
  editor: EDITOR_PATH,
  'saved-signs': SAVED_SIGNS_PATH,
  'measuring-sheets': MEASURING_SHEETS_PATH
}

const pageFromPath = () => {
  const path = window.location.pathname.replace(/\/+$/, '')
  if (path.endsWith('/saved-signs')) return 'saved-signs'
  if (path.endsWith('/measuring-sheets')) return 'measuring-sheets'
  return 'editor'
}

function App() {
  const sign = useDoorSign({ productionArchive })
  const { signData, setSignData, updateSignData, signContent, cardHolders, saveCustomHolder, archiveState } = sign
  const { isDarkMode, toggleTheme } = useTheme()
  const [page, setPage] = useState(pageFromPath)

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
      organization={signContent.organization}
      onChangeOrganization={(organization) => updateSignData(switchOrganization(organization))}
    />
  )

  return (
    <>
      {header}

      <DoorSignEditor
        sign={sign}
        hidden={page !== 'editor'}
        notice={shareNotice && (
          <div className={`share-notice share-notice--${shareNotice.kind}`} role="status">
            <p>{shareNotice.text}</p>
            <button type="button" className="share-notice__dismiss" onClick={() => setShareNotice(null)} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}
        shareButton={<ShareLinkButton signData={signData} editorHref={EDITOR_PATH} />}
        browseHref={SAVED_SIGNS_PATH}
        onBrowse={(event) => navigateTo('saved-signs', event)}
        editorHref={EDITOR_PATH}
        measuringSheetsHref={MEASURING_SHEETS_PATH}
        onOpenMeasuringSheets={(event) => navigateTo('measuring-sheets', event)}
      />

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
