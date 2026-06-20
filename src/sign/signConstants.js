// Shared print-production constants for the door-sign artwork and exporters.
// These are the single source of truth — the artwork, the preview guides, and both
// exporters all derive their geometry from here so the numbers never drift apart.

export const PT_PER_INCH = 72

// Bleed is the industry-standard 1/8"; the safe area keeps critical content clear of the
// cut. Both are used by the preview guides, the artwork canvas, and the PDF crop marks.
export const BLEED_INCHES = 0.125
export const SAFE_INCHES = 0.125

// Fallback insert size when no card holder is selected (inches).
export const DEFAULT_INSERT_SIZE = { width: 8.5, height: 5.5 }

// Printable sheet sizes offered by the PDF exporter (inches).
export const PAPER_DIMENSIONS = {
  letter: { width: 8.5, height: 11 },
  a4: { width: 8.27, height: 11.69 }
}
