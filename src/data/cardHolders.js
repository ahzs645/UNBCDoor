// Holder presets measured from the production Illustrator artboards in the print archive
// ("Door Sign" folder). Insert sizes are metric designs — the inch values are exact
// conversions of the millimetre artboards. Viewable offsets are conservative estimates of
// typical acrylic-holder frame coverage; verify against the physical holder and refine.
export const cardHolders = {
  'Building 10': {
    name: 'Building 10 Acrylic Holder',
    description: 'Current Building 10 format (177mm × 106mm insert) — the most common size in production.',
    insertSize: {
      width: 6.97,
      height: 4.17
    },
    viewableSize: {
      width: 6.67,
      height: 3.87
    },
    viewableOffset: {
      top: 0.2,
      bottom: 0.1,
      left: 0.15,
      right: 0.15
    },
    notes: 'Matches the "Building 10 / Main" artboards (6.97" × 4.17"). Frame coverage is estimated — measure the holder window before printing critical edge content.'
  },
  'Non-Building 10': {
    name: 'Standard Acrylic Holder (Non-Building 10)',
    description: 'Standard format used outside Building 10 (174mm × 100mm insert).',
    insertSize: {
      width: 6.85,
      height: 3.94
    },
    viewableSize: {
      width: 6.55,
      height: 3.64
    },
    viewableOffset: {
      top: 0.2,
      bottom: 0.1,
      left: 0.15,
      right: 0.15
    },
    notes: 'Matches the "NON-Building 10" template (6.85" × 3.94"). Later Building 4 revisions used slightly taller inserts (up to 4.16") — confirm against the specific holder.'
  },
  'NUGSS': {
    name: 'NUGSS Holder (Student Union Building)',
    description: 'NUGSS spaces in the student union building (176mm × 112mm insert).',
    insertSize: {
      width: 6.93,
      height: 4.42
    },
    viewableSize: {
      width: 6.63,
      height: 4.12
    },
    viewableOffset: {
      top: 0.2,
      bottom: 0.1,
      left: 0.15,
      right: 0.15
    },
    notes: 'Matches the NUGSS "Final V1" artboards (6.93" × 4.42").'
  },
  'Legacy Letter-Half': {
    name: 'Legacy Letter-Half Holder',
    description: 'Older 8.5" × 5.5" holders — only the archived signs use this size.',
    insertSize: {
      width: 8.5,
      height: 5.5
    },
    viewableSize: {
      width: 8.125,
      height: 4.875
    },
    viewableOffset: {
      top: 0.625,
      bottom: 0,
      left: 0.1875,
      right: 0.1875
    },
    notes: 'Half a letter sheet. Kept for reprinting archived signs; new signs should use a current holder preset.'
  }
}
