// Moving holder presets out of the app: as a cardHolders.js entry (to add it to the built-in
// presets for everyone), or as a .json file (to load it on another computer with "Import"). The
// file is the same shape custom holders are stored in, so importing it goes through the same
// checks as storage.
import { parseCustomHolders, serializeCustomHolders, toCustomRecord } from './customHolders.js'

const MM_PER_INCH = 25.4

const quote = (text) => `'${String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ')}'`
const number = (value) => String(Math.round(value * 1000) / 1000)
const mm = (inches) => String(Math.round(inches * MM_PER_INCH * 10) / 10)

// The holder written the way data/cardHolders.js lists its presets, ready to paste in.
export const holderPresetCode = (name, holder) => {
  const record = toCustomRecord(holder)
  const { insertSize: insert, viewableOffset: offset } = record
  const viewable = {
    width: insert.width - offset.left - offset.right,
    height: insert.height - offset.top - offset.bottom
  }
  const description = holder.custom || !holder.description
    ? `${mm(insert.width)}mm × ${mm(insert.height)}mm insert; the frame hides ${mm(offset.top)}mm at the top, ${mm(offset.bottom)}mm at the bottom and ${mm(offset.left)}mm / ${mm(offset.right)}mm at the sides.`
    : holder.description
  const lines = [
    `${quote(name)}: {`,
    `  name: ${quote(holder.custom || !holder.name ? name : holder.name)},`,
    `  description: ${quote(description)},`,
    `  insertSize: {`,
    `    width: ${number(insert.width)},`,
    `    height: ${number(insert.height)}`,
    `  },`,
    `  viewableSize: {`,
    `    width: ${number(viewable.width)},`,
    `    height: ${number(viewable.height)}`,
    `  },`,
    `  viewableOffset: {`,
    `    top: ${number(offset.top)},`,
    `    bottom: ${number(offset.bottom)},`,
    `    left: ${number(offset.left)},`,
    `    right: ${number(offset.right)}`,
    `  },`,
    ...(record.plateStyle ? [`  plateStyle: ${quote(record.plateStyle)},`] : []),
    ...(record.plateLineColor ? [`  plateLineColor: ${quote(record.plateLineColor)},`] : []),
    ...(record.roomNumber ? [`  roomNumber: ${quote(record.roomNumber)},`] : []),
    `  notes: ${quote(record.notes || 'Measured by hand.')}`,
    `}`
  ]
  return lines.join('\n')
}

// One or more holders ({ name: holder }) as the text of a .json file.
export const holdersToFile = (holders) => serializeCustomHolders(
  Object.fromEntries(Object.entries(holders).map(([name, holder]) => [name, toCustomRecord(holder)]))
)

// The holders in an exported file, by name; anything malformed is left out. Empty for a file
// that isn't one of these.
export const holdersFromFile = (text) => parseCustomHolders(text)

export const holderFileName = (name) => `holder-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'preset'}.json`
