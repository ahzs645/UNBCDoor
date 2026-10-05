// Search and summary helpers for a loaded sign archive. Kept free of React so the combobox on the
// editor, the saved-signs browser and the tests all rank and describe entries the same way.

export const SIGN_TYPE_LABELS = {
  faculty: 'Faculty',
  staff: 'Staff',
  student: 'Student',
  lab: 'Lab',
  'general-room': 'General room',
  'custodian-closet': 'Custodian closet'
}

// Fields a person would reasonably type to find a sign: who, what room, which department,
// how to reach them, and which holder it prints for.
const SEARCH_FIELDS = [
  'name', 'name2', 'position', 'position2', 'roomName', 'roomName2', 'contactName', 'contactName2',
  'mainDepartment', 'subDepartment', 'subSubDepartment', 'email', 'email2', 'phone', 'phone2',
  'cardHolderType', 'tagline', 'tagline2'
]

// Lower-case and strip accents so "Therese" finds "Thérèse".
const fold = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()

const entryHaystack = (entry) => {
  const signData = entry.signData || {}
  return fold([
    entry.label,
    SIGN_TYPE_LABELS[signData.signType],
    ...SEARCH_FIELDS.map(field => signData[field]),
    ...[...(signData.roles || []), ...(signData.roles2 || [])].flatMap(role => [role.title, role.unit])
  ].filter(Boolean).join(' \n '))
}

// Every whitespace-separated term must appear somewhere. Ranking, best first: the label starts
// with the query; every term starts a word in the label ("helle" → "Steve Helle" before
// "Shelley"); every term is somewhere in the label; the terms only match other fields.
export const filterSignEntries = (entries, query = '', { signType = 'all' } = {}) => {
  const byType = signType === 'all'
    ? entries
    : entries.filter(entry => entry.signData?.signType === signType)

  const terms = fold(query).split(/\s+/).filter(Boolean)
  if (!terms.length) return byType

  const folded = fold(query).trim()
  return byType
    .map((entry, index) => {
      const haystack = entryHaystack(entry)
      if (!terms.every(term => haystack.includes(term))) return null

      const label = fold(entry.label)
      const words = label.split(/[^a-z0-9@.]+/).filter(Boolean)
      let rank = 3
      if (label.startsWith(folded)) rank = 0
      else if (terms.every(term => words.some(word => word.startsWith(term)))) rank = 1
      else if (terms.every(term => label.includes(term))) rank = 2
      return { entry, rank, index }
    })
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ entry }) => entry)
}

// One short secondary line for a list row: type, department and holder.
export const describeSignEntry = (entry) => {
  const signData = entry.signData || {}
  return [
    SIGN_TYPE_LABELS[signData.signType],
    signData.mainDepartment,
    signData.cardHolderType
  ].filter(Boolean).join(' · ')
}

export const countSignTypes = (entries) => entries.reduce((counts, entry) => {
  const type = entry.signData?.signType
  if (type) counts[type] = (counts[type] || 0) + 1
  return counts
}, {})

const sameValue = (a, b) => (
  Array.isArray(a) || Array.isArray(b)
    ? JSON.stringify(a || []) === JSON.stringify(b || [])
    : a === b
)

// Field-by-field so key order (which changes as the editor merges updates) never counts as an edit.
export const signDataDiffers = (a = {}, b = {}) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) {
    if (!sameValue(a[key], b[key])) return true
  }
  return false
}
