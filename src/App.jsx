import React, { useState, useEffect, useRef } from 'react'
import { SignForm } from './components/SignForm'
import { SignPreview } from './components/SignPreview'
import { CardHolderSelector } from './components/CardHolderSelector'
import { ToggleButtons } from './components/ToggleButtons'
import { DesignationsContainer } from './components/DesignationsContainer'
import { useCardHolders } from './hooks/useCardHolders'
import { useSignState } from './hooks/useSignState'
import { departmentTypes } from './data/departments'

function App() {
  const [signData, setSignData] = useSignState()
  const { cardHolders } = useCardHolders()

  const updateSignData = (updates) => {
    setSignData(prev => ({ ...prev, ...updates }))
  }

  return (
    <div className="container">
      <div className="controls">
        <h1>UNBC Door Sign Generator</h1>
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