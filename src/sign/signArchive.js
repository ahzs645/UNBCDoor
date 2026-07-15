import { INITIAL_SIGN_DATA } from './signData.js'

export const SIGN_ARCHIVE_FORMAT = 'unbc-door-sign-archive'
export const SIGN_ARCHIVE_VERSION = 1

const SIGN_DATA_KEYS = new Set(Object.keys(INITIAL_SIGN_DATA))
const SIGN_TYPES = new Set(['faculty', 'staff', 'student', 'lab', 'general-room', 'custodian-closet'])

export const normalizeSignData = (value = {}) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Each sign must contain a signData object.')
  }

  const normalized = { ...INITIAL_SIGN_DATA, designations: [] }
  Object.entries(value).forEach(([key, fieldValue]) => {
    if (!SIGN_DATA_KEYS.has(key) || key === 'designations') return

    const defaultValue = INITIAL_SIGN_DATA[key]
    if (typeof defaultValue === 'boolean') {
      if (typeof fieldValue === 'boolean') normalized[key] = fieldValue
    } else if (typeof fieldValue === 'string') {
      normalized[key] = fieldValue
    }
  })

  normalized.designations = Array.isArray(value.designations)
    ? value.designations.filter(item => typeof item === 'string')
    : []

  if (!SIGN_TYPES.has(normalized.signType)) normalized.signType = INITIAL_SIGN_DATA.signType
  if (!['regular', 'bold', 'black'].includes(normalized.headlineWeight)) {
    normalized.headlineWeight = INITIAL_SIGN_DATA.headlineWeight
  }
  if (!['standard', 'italic'].includes(normalized.roomNameStyle)) {
    normalized.roomNameStyle = INITIAL_SIGN_DATA.roomNameStyle
  }
  if (!['stacked', 'inline'].includes(normalized.positionLayout)) {
    normalized.positionLayout = INITIAL_SIGN_DATA.positionLayout
  }
  if (!['compact', 'relaxed'].includes(normalized.twoPersonSpacing)) {
    normalized.twoPersonSpacing = INITIAL_SIGN_DATA.twoPersonSpacing
  }
  if (!['standard', 'large', 'largest'].includes(normalized.contentSize)) {
    normalized.contentSize = INITIAL_SIGN_DATA.contentSize
  }
  if (!['standard', 'compact'].includes(normalized.contentSpacing)) {
    normalized.contentSpacing = INITIAL_SIGN_DATA.contentSpacing
  }
  if (!['standard', 'wide'].includes(normalized.contentWidth)) {
    normalized.contentWidth = INITIAL_SIGN_DATA.contentWidth
  }
  if (!['left', 'center'].includes(normalized.textAlignment)) {
    normalized.textAlignment = INITIAL_SIGN_DATA.textAlignment
  }
  if (!['stacked', 'inline'].includes(normalized.contactLayout)) {
    normalized.contactLayout = INITIAL_SIGN_DATA.contactLayout
  }
  if (!['standard', 'large'].includes(normalized.contactSize)) {
    normalized.contactSize = INITIAL_SIGN_DATA.contactSize
  }
  if (!['by-person', 'by-field'].includes(normalized.roomContactGrouping)) {
    normalized.roomContactGrouping = INITIAL_SIGN_DATA.roomContactGrouping
  }
  if (!['standard', 'large'].includes(normalized.positionSize)) {
    normalized.positionSize = INITIAL_SIGN_DATA.positionSize
  }
  if (!['inline', 'below'].includes(normalized.designationLayout)) {
    normalized.designationLayout = INITIAL_SIGN_DATA.designationLayout
  }
  if (!['none', 'ctaan'].includes(normalized.organizationLogo)) {
    normalized.organizationLogo = INITIAL_SIGN_DATA.organizationLogo
  }

  return normalized
}

const normalizeEntry = (entry, index) => {
  const signData = entry?.signData || entry
  const normalized = normalizeSignData(signData)
  const fallbackLabel = normalized.name || normalized.roomName || `Sign ${index + 1}`

  return {
    id: String(entry?.id || `sign-${index + 1}`),
    label: String(entry?.label || fallbackLabel),
    source: typeof entry?.source === 'string' ? entry.source : '',
    notes: typeof entry?.notes === 'string' ? entry.notes : '',
    signData: normalized
  }
}

export const createSignArchive = (entries, metadata = {}) => ({
  format: SIGN_ARCHIVE_FORMAT,
  version: SIGN_ARCHIVE_VERSION,
  title: metadata.title || 'UNBC Door Signs',
  generatedAt: metadata.generatedAt || new Date().toISOString(),
  signs: entries.map(normalizeEntry)
})

export const parseSignArchive = (text) => {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('This file is not valid JSON.')
  }

  if (parsed?.format && parsed.format !== SIGN_ARCHIVE_FORMAT) {
    throw new Error(`Unsupported JSON format: ${parsed.format}`)
  }

  if (parsed?.version && parsed.version > SIGN_ARCHIVE_VERSION) {
    throw new Error(`This archive uses version ${parsed.version}; this app supports version ${SIGN_ARCHIVE_VERSION}.`)
  }

  const entries = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.signs)
      ? parsed.signs
      : [parsed]

  if (!entries.length) throw new Error('This archive does not contain any signs.')

  return {
    title: parsed?.title || 'Imported signs',
    signs: entries.map(normalizeEntry)
  }
}
