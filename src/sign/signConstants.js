// Shared print-production constants for the door-sign artwork and exporters.
// These are the single source of truth — the artwork, the preview guides, and both
// exporters all derive their geometry from here so the numbers never drift apart.

export const PT_PER_INCH = 72

// Bleed is the industry-standard 1/8"; the safe area keeps critical content clear of the
// cut. Both are used by the preview guides, the artwork canvas, and the PDF crop marks.
export const BLEED_INCHES = 0.125
export const SAFE_INCHES = 0.125

// Fallback insert size when no card holder is selected (inches). Matches the Building 10
// production artboards (177mm × 106mm), the most common size in the print archive.
export const DEFAULT_INSERT_SIZE = { width: 6.97, height: 4.17 }

// Crop-mark arm length (inches). Marks sit just outside the bleed, in the page margin, so
// the sheet must be at least insert + 2*bleed + 2*mark in each direction to print them.
export const MARK_INCHES = 0.25

// Printable sheet sizes offered by the PDF exporter (inches), stored in portrait. The
// exporter orients the page to the insert, so a landscape insert uses the rotated sheet.
// Ordered smallest-to-largest so the fit helper can recommend the smallest sheet that fits.
export const PAPER_DIMENSIONS = {
  letter: { width: 8.5, height: 11, label: 'Letter (8.5" × 11")' },
  a4: { width: 8.27, height: 11.69, label: 'A4 (210mm × 297mm)' },
  legal: { width: 8.5, height: 14, label: 'Legal (8.5" × 14")' },
  tabloid: { width: 11, height: 17, label: 'Tabloid (11" × 17")' }
}

// Recommendation order — smallest usable sheet first.
export const PAPER_ORDER = ['letter', 'a4', 'legal', 'tabloid']
