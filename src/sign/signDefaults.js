// Per-type placeholder values shown when a field is left blank, so the preview always reads
// as a finished sign rather than an empty template.

export const getDefaultValues = (signType) => {
  switch (signType) {
    case 'faculty':
    case 'staff':
      return {
        name: 'Dr. John Smith',
        position: 'Professor',
        email: 'john.smith@unbc.ca',
        phone: '250-960-5555'
      }
    case 'student':
      return {
        name: 'Student Name',
        email: 'student@unbc.ca'
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

// Roles with nothing typed in either half don't print.
const filledRoles = (roles) => (Array.isArray(roles) ? roles : [])
  .map(role => ({ title: (role?.title || '').trim(), unit: (role?.unit || '').trim() }))
  .filter(role => role.title || role.unit)

// Resolves the text fields shown on the sign, falling back to the per-type placeholders.
// Optional fields (tagline, roles, contact line, cell, second occupant) have no placeholders —
// they only appear on the sign when filled in. A sign with roles needs no placeholder position.
export const resolveSignValues = (signData) => {
  const defaults = getDefaultValues(signData.signType)
  const roles = filledRoles(signData.roles)
  return {
    name: signData.name || defaults.name || '',
    position: signData.position || (roles.length ? '' : defaults.position) || '',
    roles,
    roles2: filledRoles(signData.roles2),
    email: signData.email || defaults.email || '',
    phone: signData.phone || defaults.phone || '',
    roomName: signData.roomName || defaults.roomName || '',
    tagline: signData.tagline || '',
    cellPhone: signData.cellPhone || '',
    contactName: signData.contactName || '',
    name2: signData.name2 || '',
    position2: signData.position2 || '',
    tagline2: signData.tagline2 || '',
    email2: signData.email2 || '',
    phone2: signData.phone2 || '',
    cellPhone2: signData.cellPhone2 || '',
    roomName2: signData.roomName2 || '',
    contactName2: signData.contactName2 || ''
  }
}
