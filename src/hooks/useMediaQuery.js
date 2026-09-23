import { useEffect, useState } from 'react'

// Tracks a CSS media query, for UI that should not even render outside its breakpoint.
export const useMediaQuery = (query) => {
  const getMatch = () => (typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia(query).matches
    : false)
  const [matches, setMatches] = useState(getMatch)

  useEffect(() => {
    if (!window.matchMedia) return undefined
    const list = window.matchMedia(query)
    const handleChange = () => setMatches(list.matches)
    handleChange()
    list.addEventListener('change', handleChange)
    return () => list.removeEventListener('change', handleChange)
  }, [query])

  return matches
}
