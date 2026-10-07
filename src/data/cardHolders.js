// Holder presets measured from the production Illustrator artboards in the print archive
// ("Door Sign" folder). Insert sizes are metric designs — the inch values are exact
// conversions of the millimetre artboards. Viewable offsets are conservative estimates of
// typical acrylic-holder frame coverage; verify against the physical holder and refine.
//
// The card slides in from the side and runs the full width of the plate, so the insert width is
// also the plate width. `plateStyle` is the room plate the holder is built into (see
// PLATE_STYLES in components/HolderMockup.jsx): 'plain' (number only), or a line under the number
// and a braille strip — 'line' (with an optional `plateLineColor`), or the shorthands 'grey' and
// 'green'. Left out, the on-the-door preview starts on the default line + braille plate.
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
    plateStyle: 'grey',
    notes: 'Matches the "NON-Building 10" template (6.85" × 3.94"). Later Building 4 revisions used slightly taller inserts (up to 4.16") — confirm against the specific holder.'
  },
  'Number-Only Plate': {
    name: 'Plain Black Plate (estimated from photos)',
    description: 'The newer plain black plates with just the room number (Buildings 7 and 9), on the standard 174mm × 100mm insert.',
    insertSize: {
      width: 6.85,
      height: 3.94
    },
    viewableSize: {
      width: 5.75,
      height: 3.64
    },
    viewableOffset: {
      top: 0.2,
      bottom: 0.1,
      left: 0.55,
      right: 0.55
    },
    plateStyle: 'plain',
    notes: 'The side frame is estimated from a photo of 9-240 (the window is about 84% of the plate width); the top and bottom are the usual estimates. Measure a plate and update these numbers.'
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
  '6-352': {
    name: 'Room 6-352 Holder (measured)',
    description: 'Measured on the holder at room 6-352 (178mm × 113.5mm insert; the frame hides 11mm at the top and 10mm at each side).',
    insertSize: {
      width: 7.008,
      height: 4.469
    },
    viewableSize: {
      width: 6.22,
      height: 4.036
    },
    viewableOffset: {
      top: 0.433,
      bottom: 0,
      left: 0.394,
      right: 0.394
    },
    notes: 'Measured, not estimated. The NUGSS artboards fit this frame exactly: the 11mm it hides at the top is the extra blue above the NUGSS logo.'
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
