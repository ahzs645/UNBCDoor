import React from 'react'
import { FormSection } from './FormSection'
import { DesignationsContainer } from './DesignationsContainer'
import { Switch } from './Switch'

// Alumni crest and professional designations — offered on faculty and staff signs only.
export const CredentialsSection = ({ signData, onUpdate }) => {
  if (signData.signType !== 'faculty' && signData.signType !== 'staff') return null

  const hasSecondOccupant = signData.showSecondOccupant
  const firstName = signData.name || 'First occupant'
  const secondName = signData.name2 || 'Second occupant'

  return (
    <FormSection title="Alumni & designations">
      <div className="switch-list">
        <Switch
          id="showAlumni"
          checked={signData.showAlumni}
          onChange={() => onUpdate({ showAlumni: !signData.showAlumni })}
        >
          <strong>UNBC alumni crest</strong>
          {hasSecondOccupant && <span className="switch__detail">{firstName}</span>}
        </Switch>

        {hasSecondOccupant && (
          <Switch
            id="showAlumni2"
            checked={signData.showAlumni2}
            onChange={() => onUpdate({ showAlumni2: !signData.showAlumni2 })}
          >
            <strong>UNBC alumni crest</strong>
            <span className="switch__detail">{secondName}</span>
          </Switch>
        )}

        <Switch
          id="showDesignations"
          checked={signData.showDesignations}
          onChange={() => onUpdate({ showDesignations: !signData.showDesignations })}
          aria-controls="designationsContainer"
          aria-expanded={signData.showDesignations}
        >
          <strong>Professional designations</strong>
          <span className="switch__detail">Letters after the name, e.g. PhD, P.Eng</span>
        </Switch>
      </div>

      {signData.showDesignations && (
        <DesignationsContainer
          selectedDesignations={signData.designations}
          onUpdate={(designations) => onUpdate({ designations })}
        />
      )}
    </FormSection>
  )
}
