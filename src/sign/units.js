// The units measurements are shown and typed in. Everything is stored in inches (the geometry
// works in inches and points); this only changes how a length reads on screen. Millimetres are
// the default: the holders are metric parts.
import { formatInches } from './signGeometry.js'

export const MM_PER_INCH = 25.4
export const UNIT_CHOICES = ['mm', 'in']
export const DEFAULT_UNITS = 'mm'

export const toMillimetres = (inches) => Math.round(inches * MM_PER_INCH * 10) / 10

// 6.97 → "177 mm" or '6.97"'.
export const formatLength = (inches, units) => (
  units === 'in' ? `${formatInches(inches)}"` : `${toMillimetres(inches)} mm`
)

// A width × height pair: "177 × 105.9 mm" or '6.97" × 4.17"'.
export const formatSize = (width, height, units) => (
  units === 'in'
    ? `${formatInches(width)}" × ${formatInches(height)}"`
    : `${toMillimetres(width)} × ${toMillimetres(height)} mm`
)
