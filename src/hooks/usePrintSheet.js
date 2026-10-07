import { useCallback, useEffect, useState } from 'react'
import { normalizeSignData } from '../sign/signArchive'
import { resolveSignValues } from '../sign/signDefaults'
import { ROOM_SIGN_TYPES } from '../sign/signConstants'
import { CUT_GUIDES, DEFAULT_SHEET_OPTIONS, SHEET_LAYOUTS, SHEET_SPACINGS } from '../sign/printSheet'

const STORAGE_KEY = 'unbc-door-sign:print-sheet'
const MAX_ENTRIES = 60

const CHOICES = {
  layout: SHEET_LAYOUTS,
  spacing: SHEET_SPACINGS,
  cutGuides: CUT_GUIDES,
  fillWith: ['copies', 'list']
}

const readOptions = (stored) => Object.fromEntries(Object.entries(DEFAULT_SHEET_OPTIONS).map(([key, fallback]) => {
  const value = stored?.[key]
  if (CHOICES[key]) return [key, CHOICES[key].includes(value) ? value : fallback]
  return [key, typeof value === 'boolean' ? value : fallback]
}))

const readEntries = (stored) => (Array.isArray(stored) ? stored : []).slice(0, MAX_ENTRIES).flatMap((entry) => {
  try {
    return [{ id: String(entry.id), label: String(entry.label || 'Sign'), signData: normalizeSignData(entry.signData) }]
  } catch (error) {
    return []
  }
})

// Storage can be unavailable (private mode, blocked site data); the sheet then lasts this visit.
const readStored = () => {
  try {
    const data = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    return { options: readOptions(data?.options), entries: readEntries(data?.entries) }
  } catch (error) {
    return { options: { ...DEFAULT_SHEET_OPTIONS }, entries: [] }
  }
}

// What the sign prints as its headline: the person, or the room (placeholders included).
const labelFor = (signData) => {
  const { name, roomName } = resolveSignValues(signData)
  return ((ROOM_SIGN_TYPES.includes(signData.signType) ? roomName : name) || 'Untitled sign').trim()
}

// How the print-ready PDF lays out its sheet, and the sheet list: signs (or variants of one sign)
// set aside to print side by side. Each entry is a snapshot of the sign as it was when added, so
// the sign can be changed — or another saved sign opened — and added again. Kept in this browser.
export const usePrintSheet = () => {
  const [state, setState] = useState(readStored)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      // Not kept for next time; this visit still has it.
    }
  }, [state])

  const setOption = useCallback((key, value) => {
    setState(prev => ({ ...prev, options: { ...prev.options, [key]: value } }))
  }, [])

  const addEntry = useCallback((signData) => {
    setState((prev) => {
      if (prev.entries.length >= MAX_ENTRIES) return prev
      const base = labelFor(signData)
      const same = prev.entries.filter(entry => entry.label === base || entry.label.startsWith(`${base} (variant `)).length
      return {
        ...prev,
        options: { ...prev.options, layout: 'fill', fillWith: 'list' },
        entries: [...prev.entries, {
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          label: same ? `${base} (variant ${same + 1})` : base,
          signData: JSON.parse(JSON.stringify(signData))
        }]
      }
    })
  }, [])

  const removeEntry = useCallback((id) => {
    setState(prev => ({ ...prev, entries: prev.entries.filter(entry => entry.id !== id) }))
  }, [])

  const clearEntries = useCallback(() => {
    setState(prev => ({ ...prev, entries: [], options: { ...prev.options, fillWith: 'copies' } }))
  }, [])

  return {
    options: state.options,
    entries: state.entries,
    canAdd: state.entries.length < MAX_ENTRIES,
    setOption,
    addEntry,
    removeEntry,
    clearEntries
  }
}
