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

// Resolves the text fields shown on the sign, falling back to the per-type placeholders.
export const resolveSignValues = (signData) => {
  const defaults = getDefaultValues(signData.signType)
  return {
    name: signData.name || defaults.name || '',
    position: signData.position || defaults.position || '',
    email: signData.email || defaults.email || '',
    phone: signData.phone || defaults.phone || '',
    roomName: signData.roomName || defaults.roomName || ''
  }
}
