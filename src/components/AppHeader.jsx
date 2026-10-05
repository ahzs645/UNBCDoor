import React from 'react'
import { UnbcLogoMark } from '@unbc/logo'
import { ThemeToggle } from './ThemeToggle'

const NAV_ITEMS = [
  { page: 'editor', label: 'Editor' },
  { page: 'saved-signs', label: 'Saved signs' },
  { page: 'measuring-sheets', label: 'Measuring sheets' }
]

// The app bar shared by all three pages: the UNBC wordmark, the page tabs and the theme toggle.
// The tabs are real links, so they open in a new tab with a modifier key like any other link.
export const AppHeader = ({ page, paths, onNavigate, archiveCount, isDarkMode, onToggleTheme }) => (
  <header className="app-header">
    <div className="app-header__inner">
      <a
        className="app-header__brand"
        href={paths.editor}
        onClick={(event) => onNavigate('editor', event)}
        aria-label="UNBC Door Sign Generator — editor"
      >
        {/* Cropped to the wordmark: the lockup's native box leaves room for a department line. */}
        <svg className="app-header__logo" viewBox="0 15 178 31" aria-hidden="true" focusable="false">
          <UnbcLogoMark />
        </svg>
        <span className="app-header__product">Door Signs</span>
      </a>

      <nav className="app-header__nav" aria-label="Pages">
        {NAV_ITEMS.map(({ page: target, label }) => (
          <a
            key={target}
            className="app-header__link"
            href={paths[target]}
            aria-current={page === target ? 'page' : undefined}
            onClick={(event) => onNavigate(target, event)}
          >
            {label}
            {target === 'saved-signs' && archiveCount > 0 && (
              <span className="app-header__badge" aria-label={`${archiveCount} loaded`}>{archiveCount}</span>
            )}
          </a>
        ))}
      </nav>

      <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleTheme} />
    </div>
  </header>
)
