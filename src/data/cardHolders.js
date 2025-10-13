export const cardHolders = {
  'Landscape - Standard': {
    name: 'Standard Landscape Acrylic Holder',
    description: 'Most common landscape holders used across academic and administrative areas.',
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
    notes: 'Slim side rails with a moderate top bar. The bottom edge is fully viewable.'
  },
  'Landscape - Wide Border': {
    name: 'Landscape Holder with Wide Border',
    description: 'Rooms that use holders with a deeper acrylic frame and thicker side bars.',
    insertSize: {
      width: 9.0,
      height: 6.0
    },
    viewableSize: {
      width: 8.25,
      height: 5.0
    },
    viewableOffset: {
      top: 0.75,
      bottom: 0.25,
      left: 0.375,
      right: 0.375
    },
    notes: 'Heavier acrylic frame with noticeable bars on all sides. Ensure critical content stays inside the viewable window.'
  },
  'Portrait - Slim': {
    name: 'Slim Portrait Holder',
    description: 'Used in elevators and select residence areas for vertically oriented notices.',
    insertSize: {
      width: 4.25,
      height: 11.0
    },
    viewableSize: {
      width: 3.75,
      height: 10.25
    },
    viewableOffset: {
      top: 0.5,
      bottom: 0.25,
      left: 0.25,
      right: 0.25
    },
    notes: 'Tall portrait orientation with slim side rails. Allow extra padding near the top for best visibility.'
  },
  'Landscape - Residence Compact': {
    name: 'Residence Compact Landscape Holder',
    description: 'Smaller holders typically found in residence hallways and ancillary spaces.',
    insertSize: {
      width: 7.5,
      height: 4.5
    },
    viewableSize: {
      width: 6.9,
      height: 3.9
    },
    viewableOffset: {
      top: 0.45,
      bottom: 0.15,
      left: 0.3,
      right: 0.3
    },
    notes: 'Compact frame with shallow viewing window. Avoid important content along the outer edges.'
  }
}
