import React from 'react'

// Light/dark toggle button. Shows a sun in dark mode (tap to go light) and a moon in light
// mode (tap to go dark).
export const ThemeToggle = ({ isDarkMode, onToggle }) => (
  <button
    type="button"
    className="theme-toggle-button"
    onClick={onToggle}
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
)
