import { useSyncExternalStore } from 'react'
import { DEFAULT_UNITS, UNIT_CHOICES } from '../sign/units'

// The measurement units picked under Settings, shared by every screen and kept in this browser.
// Storage can be unavailable (private mode, blocked site data); then the choice lasts this visit.
const UNITS_KEY = 'unbc-door-sign:units'
const listeners = new Set()

const read = () => {
  try {
    const stored = window.localStorage.getItem(UNITS_KEY)
    return UNIT_CHOICES.includes(stored) ? stored : DEFAULT_UNITS
  } catch (error) {
    return DEFAULT_UNITS
  }
}

let current = typeof window === 'undefined' ? DEFAULT_UNITS : read()

export const setUnits = (units) => {
  if (!UNIT_CHOICES.includes(units) || units === current) return
  current = units
  try {
    window.localStorage.setItem(UNITS_KEY, units)
  } catch (error) {
    // Not remembered for next time.
  }
  listeners.forEach(listener => listener())
}

const subscribe = (listener) => {
  listeners.add(listener)
  // Another tab changed the setting.
  const handleStorage = (event) => {
    if (event.key !== UNITS_KEY) return
    current = read()
    listener()
  }
  window.addEventListener('storage', handleStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', handleStorage)
  }
}

export const useUnits = () => useSyncExternalStore(subscribe, () => current, () => DEFAULT_UNITS)
