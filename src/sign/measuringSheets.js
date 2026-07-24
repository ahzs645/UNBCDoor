import { buildHolderTemplateDocument } from './signTemplate.js'
import { buildMeasuringGridDocument } from './signGrid.js'
import { fileSlug } from './pdfPrimitives.js'

// One entry point for the three printable measuring sheets, so the configure-and-print page
// (and anything else that wants one) works from a single config object instead of knowing
// which module draws what.

export const SHEET_MODES = [
  {
    value: 'template',
    label: 'Holder template',
    summary: 'The selected holder at 1:1 — bleed, cut line, viewable window and the strips the frame hides, every dimension labelled.',
    usesHolder: true,
    usesGrid: false
  },
  {
    value: 'template-grid',
    label: 'Template + grid',
    summary: 'The same sheet with a measuring grid inside the insert, anchored to the cut corner — for reading off exactly where the frame edge falls.',
    usesHolder: true,
    usesGrid: true
  },
  {
    value: 'grid',
    label: 'Measuring grid',
    summary: 'A full sheet of grid for a holder nobody has measured yet: trim it with scissors until it slides in, then read the size off the numbers.',
    usesHolder: false,
    usesGrid: true
  }
]

export const getSheetMode = (mode) =>
  SHEET_MODES.find(({ value }) => value === mode) || SHEET_MODES[0]

// Grid line spacing offered on the configure page. Quarter inches suit scissors; eighths are
// for reading a frame edge closely, halves for a cleaner sheet.
export const GRID_DETAIL_OPTIONS = [
  { value: 2, label: '½ inch' },
  { value: 4, label: '¼ inch' },
  { value: 8, label: '⅛ inch' }
]

export const buildMeasuringSheet = (config) => {
  const { mode = 'template' } = config

  if (mode === 'grid') {
    return buildMeasuringGridDocument({
      paperSize: config.paperSize,
      cardHolders: config.cardHolders,
      subdivisions: config.subdivisions,
      showCoordinates: config.showCoordinates,
      showPresetOutlines: config.showPresetOutlines
    })
  }

  return buildHolderTemplateDocument({
    insertSize: config.insertSize,
    viewableSize: config.viewableSize,
    viewableOffset: config.viewableOffset,
    paperSize: config.paperSize,
    holderKey: config.holderKey,
    holderName: config.holderName,
    holderNotes: config.holderNotes,
    showGrid: mode === 'template-grid',
    subdivisions: config.subdivisions,
    showCoordinates: config.showCoordinates
  })
}

export const measuringSheetFilename = ({ mode = 'template', holderKey }) => {
  if (mode === 'grid') return 'unbc-door-sign-measuring-grid.pdf'
  const suffix = mode === 'template-grid' ? '-grid' : ''
  return `unbc-door-sign-template-${fileSlug(holderKey)}${suffix}.pdf`
}

// Object URL for the live preview. The caller owns it and must revoke it when it swaps in a
// new one, otherwise every keystroke on the configure page leaks a blob.
export const measuringSheetPreviewUrl = (config) =>
  buildMeasuringSheet(config).output('bloburl').toString()

export const downloadMeasuringSheet = (config) => {
  buildMeasuringSheet(config).save(measuringSheetFilename(config))
}

// Opens the sheet in a new tab with the print dialog already up. Popup blockers can stop
// that, so fall back to a plain download rather than doing nothing.
export const printMeasuringSheet = (config) => {
  const doc = buildMeasuringSheet(config)
  doc.autoPrint()

  const printWindow = window.open(doc.output('bloburl').toString(), '_blank')
  if (!printWindow) {
    doc.save(measuringSheetFilename(config))
    return false
  }
  return true
}
