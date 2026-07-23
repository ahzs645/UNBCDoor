import React, { useEffect, useState } from 'react'
import { SignForm } from './components/SignForm'
import { SignPreview } from './components/SignPreview'
import { CardHolderSelector } from './components/CardHolderSelector'
import { ToggleButtons } from './components/ToggleButtons'
import { DesignationsContainer } from './components/DesignationsContainer'
import { ThemeToggle } from './components/ThemeToggle'
import { SignArchiveControls } from './components/SignArchiveControls'
import { useCardHolders } from './hooks/useCardHolders'
import { useSignState } from './hooks/useSignState'
import { useTheme } from './hooks/useTheme'
import { departmentTypes } from './unbc'

const EDITOR_PATH = import.meta.env.BASE_URL
const SAVED_SIGNS_PATH = `${import.meta.env.BASE_URL}saved-signs/`
const pageFromPath = () => (
  window.location.pathname.replace(/\/+$/, '').endsWith('/saved-signs')
    ? 'saved-signs'
    : 'editor'
)

function App() {
  const [signData, setSignData] = useSignState()
  const { cardHolders } = useCardHolders()
  const { isDarkMode, toggleTheme } = useTheme()
  const [activeMobileTab, setActiveMobileTab] = useState('editor')
  const [page, setPage] = useState(pageFromPath)

  const updateSignData = (updates) => {
    setSignData(prev => ({ ...prev, ...updates }))
  }

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

    const path = nextPage === 'saved-signs' ? SAVED_SIGNS_PATH : EDITOR_PATH
    window.history.pushState({}, '', path)
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div className="container" hidden={page !== 'editor'}>
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

          <SignPreview signData={signData} cardHolders={cardHolders} onUpdate={updateSignData} />

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
      </div>

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
