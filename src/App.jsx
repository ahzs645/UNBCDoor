import React, { useState } from 'react'
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

function App() {
  const [signData, setSignData] = useSignState()
  const { cardHolders } = useCardHolders()
  const { isDarkMode, toggleTheme } = useTheme()
  const [activeMobileTab, setActiveMobileTab] = useState('editor')

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
          <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
        </div>
        <SignArchiveControls
          signData={signData}
          onLoadSign={(loadedSign) => setSignData(loadedSign)}
        />
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
