import React from 'react'
import { FormSection } from './FormSection'
import { DesignationsContainer } from './DesignationsContainer'
import { Switch } from './Switch'
import { firstName } from './SignForm'

// Professional designations — offered on faculty and staff signs only. They follow the first
// person's name; each person's alumni crest is switched on in their own tab of the form.
export const CredentialsSection = ({ signData, onUpdate }) => {
  if (signData.signType !== 'faculty' && signData.signType !== 'staff') return null

  const forWhom = signData.showSecondOccupant ? firstName(signData.name) || 'the first person' : null

  return (
    <FormSection title="Designations">
      <div className="switch-list">
        <Switch
          id="showDesignations"
          checked={signData.showDesignations}
          onChange={() => onUpdate({ showDesignations: !signData.showDesignations })}
          aria-controls="designationsContainer"
          aria-expanded={signData.showDesignations}
        >
          <strong>Professional designations</strong>
          <span className="switch__detail">
            Letters after {forWhom ? `${forWhom}’s` : 'the'} name, e.g. PhD, P.Eng
          </span>
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
