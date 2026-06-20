import { useState, useEffect } from 'react'

// Owns the light/dark theme: hydrates from localStorage (falling back to the OS preference),
// then keeps the <body> class and localStorage in sync whenever the mode changes.
export const useTheme = () => {
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

  const toggleTheme = () => setIsDarkMode((prev) => !prev)

  return { isDarkMode, toggleTheme }
}
