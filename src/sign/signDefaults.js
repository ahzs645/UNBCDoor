import { ROOM_SIGN_TYPES } from './signConstants.js'
import { foldPositionIntoRoles, normalizeRole } from './signRoles.js'

// Per-type placeholder values shown when a field is left blank, so the preview always reads
// as a finished sign rather than an empty template.

export const getDefaultValues = (signType) => {
  switch (signType) {
    case 'faculty':
    case 'staff':
      return {
        name: 'Dr. John Smith',
        position: 'Professor',
        phone: '250-960-5555'
      }
    case 'student':
      return {
        name: 'Student Name'
      }
    case 'lab':
      return { roomName: 'Research Lab' }
    case 'general-room':
      return { roomName: 'Conference Room' }
    case 'custodian-closet':
      return { roomName: 'Storage Room' }
    default:
      return {}
  }
}

// Honorifics in front of a name ("Dr. Jane Doe"), which neither a tab label nor an address uses.
export const NAME_TITLES = /^(dr|prof|professor|mr|mrs|ms|mx|miss|rev|sir|dame)\.?$/i

// A person's UNBC address when none is typed: first.last@unbc.ca, from the name without its
// title, designations (", PhD"), accents or punctuation.
export const emailFromName = (name) => {
  const words = (name || '')
    .split(',')[0]
    .replace(/\([^)]*\)/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .split(/\s+/)
    .filter(word => word && !NAME_TITLES.test(word))
    .map(word => word.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    .filter(Boolean)
  if (!words.length) return ''
  const parts = words.length > 1 ? [words[0], words[words.length - 1]] : words
  return `${parts.join('.')}@unbc.ca`
}

// Roles with nothing typed in them don't print. A position still in its old field (from data
// that skipped the importer) prints as the first role.
const filledRoles = (roles, position, positionLayout) => foldPositionIntoRoles(
  position,
  (Array.isArray(roles) ? roles : []).filter(role => role && typeof role === 'object'),
  positionLayout
)
  .map(normalizeRole)
  .map(role => ({ ...role, title: role.title.trim(), unit: role.unit.trim(), note: role.note.trim() }))
  .filter(role => role.title || role.unit || role.note)

// Resolves the text fields shown on the sign, falling back to the per-type placeholders.
// Optional fields (tagline, contact line, cell, second and third occupants) have no placeholders — they
// only appear on the sign when filled in. A person's email defaults to first.last@unbc.ca from
// their name, and a sign with no position shows the placeholder one.
export const resolveSignValues = (signData) => {
  const defaults = getDefaultValues(signData.signType)
  const isPerson = !ROOM_SIGN_TYPES.includes(signData.signType)
  const roles = filledRoles(signData.roles, signData.position, signData.positionLayout)
  const name = signData.name || defaults.name || ''
  return {
    name,
    position: roles.length ? '' : defaults.position || '',
    roles,
    roles2: filledRoles(signData.roles2, signData.position2, signData.positionLayout),
    roles3: filledRoles(signData.roles3, '', signData.positionLayout),
    email: signData.email || (isPerson ? emailFromName(name) : ''),
    phone: signData.phone || defaults.phone || '',
    roomName: signData.roomName || defaults.roomName || '',
    tagline: signData.tagline || '',
    cellPhone: signData.cellPhone || '',
    contactName: signData.contactName || '',
    name2: signData.name2 || '',
    position2: '',
    tagline2: signData.tagline2 || '',
    email2: signData.email2 || (isPerson ? emailFromName(signData.name2) : ''),
    phone2: signData.phone2 || '',
    cellPhone2: signData.cellPhone2 || '',
    roomName2: signData.roomName2 || '',
    contactName2: signData.contactName2 || '',
    name3: signData.name3 || '',
    tagline3: signData.tagline3 || '',
    email3: signData.email3 || (isPerson ? emailFromName(signData.name3) : ''),
    phone3: signData.phone3 || '',
    cellPhone3: signData.cellPhone3 || ''
  }
}
