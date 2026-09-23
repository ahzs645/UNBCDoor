import { useState, useEffect } from 'react'

const THEME_KEY = 'theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

// Storage can be unavailable (private mode, blocked site data); the theme then just follows
// the OS for this visit.
const readStoredTheme = () => {
  try {
    const stored = window.localStorage.getItem(THEME_KEY)
    return stored === 'dark' || stored === 'light' ? stored : null
  } catch (error) {
    return null
  }
}

const systemPrefersDark = () => Boolean(window.matchMedia && window.matchMedia(DARK_QUERY).matches)

// Owns the light/dark theme. The initial value is read synchronously (a stored choice wins,
// otherwise the OS preference) so the first render is already in the right theme and nothing
// gets written back before it's known. The inline script in each page's <head> applies the
// same class before React loads, so there is no flash of the wrong theme either.
export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = readStoredTheme()
    return stored ? stored === 'dark' : systemPrefersDark()
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', isDarkMode)
    document.body.classList.toggle('dark-mode', isDarkMode)
  }, [isDarkMode])

  // Until the user picks a theme, keep following the OS as it changes (e.g. sunset switching).
  useEffect(() => {
    if (!window.matchMedia) return undefined
    const query = window.matchMedia(DARK_QUERY)
    const handleChange = (event) => {
      if (!readStoredTheme()) setIsDarkMode(event.matches)
    }
    query.addEventListener?.('change', handleChange)
    return () => query.removeEventListener?.('change', handleChange)
  }, [])

  const toggleTheme = () => {
    const next = !isDarkMode
    setIsDarkMode(next)
    try {
      window.localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
    } catch (error) {
      // Not remembered; the choice still applies for this visit.
    }
  }

  return { isDarkMode, toggleTheme }
}
