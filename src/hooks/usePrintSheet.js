import { useCallback, useEffect, useState } from 'react'
import { normalizeSignData } from '../sign/signArchive'
import { signDataDiffers } from '../sign/signArchiveSearch'
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

// "Name", or "Name (variant 3)" when the list already has entries for that headline (not counting
// `exceptId`, the entry being relabelled).
const entryLabel = (entries, signData, exceptId) => {
  const base = labelFor(signData)
  const same = entries.filter(entry => entry.id !== exceptId
    && (entry.label === base || entry.label.startsWith(`${base} (variant `))).length
  return same ? `${base} (variant ${same + 1})` : base
}

const snapshot = (signData) => JSON.parse(JSON.stringify(signData))

// Whether the editor's sign differs from an entry's snapshot. Both go through the archive's
// normalizer first: entries are normalized when read back from storage, the editor's sign isn't.
export const entryDiffers = (entry, signData) => signDataDiffers(
  normalizeSignData(entry.signData),
  normalizeSignData(signData)
)

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
      return {
        ...prev,
        options: { ...prev.options, layout: 'fill', fillWith: 'list' },
        entries: [...prev.entries, {
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          label: entryLabel(prev.entries, signData),
          signData: snapshot(signData)
        }]
      }
    })
  }, [])

  // An entry can be opened in the editor, changed, and saved back over its snapshot. Which one is
  // open lasts this visit only.
  const [openId, setOpenId] = useState(null)

  // Writes the editor's sign over an entry's snapshot. The label follows the headline if that
  // changed, and keeps its place in the list.
  const saveEntry = useCallback((id, signData) => {
    setState(prev => ({
      ...prev,
      entries: prev.entries.map((entry) => {
        if (entry.id !== id) return entry
        const label = labelFor(signData) === labelFor(entry.signData) ? entry.label : entryLabel(prev.entries, signData, id)
        return { ...entry, label, signData: snapshot(signData) }
      })
    }))
  }, [])

  const removeEntry = useCallback((id) => {
    setState(prev => ({ ...prev, entries: prev.entries.filter(entry => entry.id !== id) }))
    setOpenId(current => (current === id ? null : current))
  }, [])

  const clearEntries = useCallback(() => {
    setState(prev => ({ ...prev, entries: [], options: { ...prev.options, fillWith: 'copies' } }))
    setOpenId(null)
  }, [])

  return {
    options: state.options,
    entries: state.entries,
    canAdd: state.entries.length < MAX_ENTRIES,
    setOption,
    addEntry,
    removeEntry,
    clearEntries,
    openEntry: state.entries.find(entry => entry.id === openId) || null,
    setOpenId,
    saveEntry
  }
}
