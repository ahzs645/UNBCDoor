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
      <div className="controls">
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
              {isDarkMode ? '🌞' : '🌙'}
            </span>
          </button>
        </div>
        <SignForm
          signData={signData}
          onUpdate={updateSignData}
          departments={departmentTypes}
        />
      </div>

      <div className="card-holder-selector-container">
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
