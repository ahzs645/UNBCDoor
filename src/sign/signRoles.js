// A position on the sign: the job, the faculty or department it belongs to, and an optional
// italic line under it (e.g. Director | Northern Analytical Laboratory Services, then "Northern
// BC’s Environment & Climate Solutions Innovation Hub"). Each one says how its own department
// prints — beside the job after a bar, on its own line, or not at all — and whether the job
// itself starts a new line at every | · or ;. A department beside the job is set off by a bar,
// or by space alone.

export const ROLE_UNIT_LAYOUTS = ['beside', 'below', 'hidden']
export const ROLE_TITLE_LAYOUTS = ['stacked', 'inline']
export const ROLE_UNIT_DIVIDERS = ['bar', 'none']

export const EMPTY_ROLE = { title: '', unit: '', note: '', unitLayout: 'beside', unitDivider: 'bar', titleLayout: 'stacked' }

const SEPARATORS = /\s*(?:\r?\n|[·•|;])\s*/
const LINE_BREAKS = /\s*\r?\n\s*/

// Enter breaks the line either way, so only these make "split" and "as typed" differ.
export const hasTitleSeparator = (title) => /[·•|;]/.test(title || '')

// The job's printed lines.
export const splitRoleTitle = (role) => (role.title || '')
  .split(role.titleLayout === 'inline' ? LINE_BREAKS : SEPARATORS)
  .map(piece => piece.trim())
  .filter(Boolean)

// Anything that isn't a role object is dropped and a missing field reads as blank. Roles saved
// before the job could be split printed it as typed, so that is their default.
export const normalizeRole = (role) => ({
  title: typeof role.title === 'string' ? role.title : '',
  unit: typeof role.unit === 'string' ? role.unit : '',
  note: typeof role.note === 'string' ? role.note : '',
  unitLayout: ROLE_UNIT_LAYOUTS.includes(role.unitLayout) ? role.unitLayout : 'beside',
  unitDivider: ROLE_UNIT_DIVIDERS.includes(role.unitDivider) ? role.unitDivider : 'bar',
  titleLayout: ROLE_TITLE_LAYOUTS.includes(role.titleLayout) ? role.titleLayout : 'inline'
})

export const normalizeRoles = (roles) => (Array.isArray(roles)
  ? roles
    .filter(role => role && typeof role === 'object' && !Array.isArray(role))
    .map(normalizeRole)
  : [])

// Signs used to keep the main position in a field of its own, above the roles. It becomes the
// first role, split (or not) the way the sign's old position layout did, so it prints as before.
export const foldPositionIntoRoles = (position, roles, positionLayout) => {
  if (typeof position !== 'string' || !position.trim()) return roles
  return [
    { ...EMPTY_ROLE, title: position, titleLayout: positionLayout === 'inline' ? 'inline' : 'stacked' },
    ...roles
  ]
}

// "Associate Professor | Faculty of Environment" → the job and its department in their own
// fields. A job that was printing on two lines keeps its department on a line of its own.
export const separateRoleUnit = (role) => {
  const bar = (role.title || '').indexOf('|')
  if (bar < 0 || role.unit) return role
  return {
    ...role,
    title: role.title.slice(0, bar).trim(),
    unit: role.title.slice(bar + 1).replace(/\s*\r?\n\s*/g, ' ').trim(),
    unitLayout: role.titleLayout === 'inline' ? 'beside' : 'below',
    titleLayout: 'stacked'
  }
}
