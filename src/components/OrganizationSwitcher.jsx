import React, { useEffect, useRef, useState } from 'react'
import { UnbcLogoMark } from '@unbc/logo'
import { NugssLogoMark } from '../sign/NugssLogoMark'
import { NUGSS_LOGO } from '../assets/nugssLogo'
import { ORGANIZATIONS } from '../sign/organizations'

// Each organization's logo as it sits on its own colour, cropped to the ink.
export const OrganizationLogo = ({ organization, className }) => (
  organization === 'nugss' ? (
    <svg className={className} viewBox={`-0.5 -0.5 ${NUGSS_LOGO.width + 1} ${NUGSS_LOGO.height + 1}`} aria-hidden="true" focusable="false">
      <NugssLogoMark />
    </svg>
  ) : (
    // Cropped to the wordmark: the lockup's native box leaves room for a department line.
    <svg className={className} viewBox="0 15 178 31" aria-hidden="true" focusable="false">
      <UnbcLogoMark />
    </svg>
  )
)

// The logo in the app bar doubles as the organization picker: clicking it lists the
// organizations, and picking one moves the sign (logo, band colour, starting appearance) and the
// app's colours over to it.
export const OrganizationSwitcher = ({ organization, onChange }) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const current = ORGANIZATIONS[organization] || ORGANIZATIONS.unbc

  useEffect(() => {
    if (!open) return undefined
    const handlePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        rootRef.current?.querySelector('.org-switcher__button')?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const choose = (key) => {
    setOpen(false)
    if (key !== organization) onChange(key)
  }

  return (
    <div className="org-switcher" ref={rootRef}>
      <button
        type="button"
        className="org-switcher__button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${current.label} — switch organization`}
        title="Switch organization"
        onClick={() => setOpen(value => !value)}
      >
        <OrganizationLogo organization={organization} className={`app-header__logo app-header__logo--${organization}`} />
        <svg className="org-switcher__caret" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d="m3 4.5 3 3 3-3" />
        </svg>
      </button>

      {open && (
        <div className="org-switcher__menu" role="menu" aria-label="Organization">
          <p className="org-switcher__heading">Make signs for</p>
          {Object.entries(ORGANIZATIONS).map(([key, org]) => (
            <button
              key={key}
              type="button"
              role="menuitemradio"
              aria-checked={key === organization}
              className="org-switcher__option"
              onClick={() => choose(key)}
              autoFocus={key === organization}
            >
              <span className="org-switcher__swatch" style={{ background: org.headerColor }}>
                <OrganizationLogo organization={key} className={`org-switcher__logo org-switcher__logo--${key}`} />
              </span>
              <span className="org-switcher__text">
                <strong>{org.label}</strong>
                <span>{org.fullName}</span>
              </span>
            </button>
          ))}
          <p className="org-switcher__note">Switches the sign’s logo and band colour. Your text stays as it is.</p>
        </div>
      )}
    </div>
  )
}
