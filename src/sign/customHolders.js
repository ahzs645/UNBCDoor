// Holder presets made in the app and kept in this browser's localStorage, next to the built-in
// ones in data/cardHolders.js. They're stored by name (the name is also the holder's key in the
// picker) with only the measurements; everything else a preset carries is derived here.

export const CUSTOM_HOLDERS_KEY = 'unbc-door-sign:custom-holders'
const STORAGE_VERSION = 1

export const MAX_HOLDER_NAME = 40
// Generous bounds — anything outside them is a typo, not a holder.
const MAX_INSERT_INCHES = 20
const EDGES = ['top', 'right', 'bottom', 'left']

const round = (value) => Math.round(value * 1000) / 1000
const finite = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : NaN)

// Everything wrong with a holder before it can be saved, as sentences for the form. Empty when
// it's fine. `takenNames` are the names already in use (built-in and custom), excluding the
// holder being edited.
export const validateCustomHolder = ({ name, insertSize, viewableOffset }, takenNames = []) => {
  const problems = []
  const trimmed = (name || '').trim()
  if (!trimmed) problems.push('Give the holder a name.')
  else if (trimmed.length > MAX_HOLDER_NAME) problems.push(`Keep the name to ${MAX_HOLDER_NAME} characters.`)
  else if (takenNames.some(taken => taken.toLowerCase() === trimmed.toLowerCase())) {
    problems.push('There is already a holder with that name.')
  }

  const width = finite(insertSize?.width)
  const height = finite(insertSize?.height)
  if (!(width > 0 && width <= MAX_INSERT_INCHES) || !(height > 0 && height <= MAX_INSERT_INCHES)) {
    problems.push(`The insert must be between 0 and ${MAX_INSERT_INCHES}" on each side.`)
  }

  const offsets = EDGES.map(edge => finite(viewableOffset?.[edge]))
  if (offsets.some(value => !(value >= 0))) {
    problems.push('Frame coverage can’t be negative.')
  } else if (width > 0 && height > 0) {
    const [top, right, bottom, left] = offsets
    if (left + right >= width || top + bottom >= height) {
      problems.push('The frame covers the whole insert — no window would be left.')
    }
  }

  return problems
}

// The stored record → a full preset, shaped like the built-in ones.
export const toCardHolder = (record) => {
  const insertSize = { width: round(record.insertSize.width), height: round(record.insertSize.height) }
  const viewableOffset = Object.fromEntries(EDGES.map(edge => [edge, round(record.viewableOffset[edge])]))
  return {
    name: 'Saved in this browser',
    custom: true,
    description: 'A custom holder saved in this browser.',
    insertSize,
    viewableSize: {
      width: round(insertSize.width - viewableOffset.left - viewableOffset.right),
      height: round(insertSize.height - viewableOffset.top - viewableOffset.bottom)
    },
    viewableOffset,
    ...(record.plateStyle ? { plateStyle: record.plateStyle } : {}),
    ...(record.plateLineColor ? { plateLineColor: record.plateLineColor } : {}),
    ...(record.notes ? { notes: record.notes } : {})
  }
}

// Just what's worth storing for a holder.
export const toCustomRecord = ({ insertSize, viewableOffset, plateStyle, plateLineColor, notes }) => ({
  insertSize: { width: round(insertSize.width), height: round(insertSize.height) },
  viewableOffset: Object.fromEntries(EDGES.map(edge => [edge, round(viewableOffset[edge])])),
  ...(plateStyle ? { plateStyle } : {}),
  ...(plateStyle !== 'plain' && /^#[0-9a-f]{6}$/i.test(plateLineColor || '') ? { plateLineColor } : {}),
  ...(notes ? { notes: String(notes).slice(0, 500) } : {})
})

// Parses what's in storage, dropping anything malformed (storage is shared with whatever else
// ran on this origin, and older versions of the app).
export const parseCustomHolders = (raw) => {
  let data
  try {
    data = JSON.parse(raw || 'null')
  } catch (error) {
    return {}
  }
  const holders = data?.version === STORAGE_VERSION && data.holders && typeof data.holders === 'object'
    ? data.holders
    : {}
  return Object.fromEntries(Object.entries(holders).flatMap(([name, record]) => {
    if (!record || validateCustomHolder({ name, ...record }).length) return []
    return [[name.trim(), toCustomRecord(record)]]
  }))
}

export const serializeCustomHolders = (records) => JSON.stringify({ version: STORAGE_VERSION, holders: records })

// Storage can be unavailable (private mode, blocked site data): then custom holders last for
// this visit only.
export const readCustomHolders = (storage = globalThis.localStorage) => {
  try {
    return parseCustomHolders(storage?.getItem(CUSTOM_HOLDERS_KEY))
  } catch (error) {
    return {}
  }
}

export const writeCustomHolders = (records, storage = globalThis.localStorage) => {
  try {
    storage?.setItem(CUSTOM_HOLDERS_KEY, serializeCustomHolders(records))
    return true
  } catch (error) {
    return false
  }
}
