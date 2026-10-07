import React from 'react'
import { ThemeToggle } from './ThemeToggle'
import { OrganizationSwitcher } from './OrganizationSwitcher'

const NAV_ITEMS = [
  { page: 'editor', label: 'Editor' },
  { page: 'saved-signs', label: 'Saved signs' },
  { page: 'measuring-sheets', label: 'Measuring sheets' }
]

// The app bar shared by all three pages: the organization's logo (which also switches the
// organization), the page tabs and the theme toggle. The tabs are real links, so they open in a new
// tab with a modifier key like any other link.
export const AppHeader = ({
  page,
  paths,
  onNavigate,
  archiveCount,
  isDarkMode,
  onToggleTheme,
  organization,
  onChangeOrganization
}) => (
  <header className="app-header">
    <div className="app-header__inner">
      <div className="app-header__brand">
        <OrganizationSwitcher organization={organization} onChange={onChangeOrganization} />
        <a
          className="app-header__product"
          href={paths.editor}
          onClick={(event) => onNavigate('editor', event)}
          aria-label="Door Sign Generator — editor"
        >
          Door Signs
        </a>
      </div>
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
