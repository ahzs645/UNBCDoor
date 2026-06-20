import React, { useState, useEffect } from 'react'
import { SignForm } from './components/SignForm'
import { SignPreview } from './components/SignPreview'
import { CardHolderSelector } from './components/CardHolderSelector'
import { ToggleButtons } from './components/ToggleButtons'
import { DesignationsContainer } from './components/DesignationsContainer'
import { useCardHolders } from './hooks/useCardHolders'
import { useSignState } from './hooks/useSignState'
import { departmentTypes } from './unbc'

function App() {
  const [signData, setSignData] = useSignState()
  const { cardHolders } = useCardHolders()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activeMobileTab, setActiveMobileTab] = useState('editor')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const storedTheme = window.localStorage.getItem('theme')

    if (storedTheme) {
      setIsDarkMode(storedTheme === 'dark')
      return
    }

    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDarkMode(prefersDark)
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('dark-mode', isDarkMode)
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    }
  }, [isDarkMode])

  const updateSignData = (updates) => {
    setSignData(prev => ({ ...prev, ...updates }))
  }

  return (
    <div className="container">
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
          <button
            type="button"
            className="theme-toggle-button"
            onClick={() => setIsDarkMode(prev => !prev)}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span aria-hidden="true" className="theme-toggle-icon">
              {isDarkMode ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </span>
          </button>
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

        <SignPreview signData={signData} cardHolders={cardHolders} />

        <ToggleButtons 
          signType={signData.signType}
          showAlumni={signData.showAlumni}
          showDesignations={signData.showDesignations}
          onToggleAlumni={() => updateSignData({ showAlumni: !signData.showAlumni })}
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
  )
}

export default App
