import { BLEED_INCHES, SAFE_INCHES, DEFAULT_INSERT_SIZE } from './signConstants'

// Trims trailing zeros so 8.50 -> "8.5" and 11.00 -> "11" in the measurement readout.
const formatInches = (value) => {
  if (Number.isInteger(value)) {
    return value.toString()
  }
  return value.toFixed(2).replace(/\.00$/, '').replace(/0$/, '')
}

// Derives every measurement the preview needs from the selected card holder (or the default
// insert when none is chosen): the trim/viewable sizes, the CSS custom properties that drive
// the bleed/safe/holder guide overlays, and the human-readable measurement summary.
export const resolveCardHolderGeometry = (selectedCardHolder) => {
  const insertSize = selectedCardHolder?.insertSize || DEFAULT_INSERT_SIZE
  const viewableSize = selectedCardHolder?.viewableSize || insertSize

  const horizontalDifference = Math.max(insertSize.width - viewableSize.width, 0)
  const verticalDifference = Math.max(insertSize.height - viewableSize.height, 0)

  const viewableOffset = selectedCardHolder?.viewableOffset || {
    top: verticalDifference,
    bottom: 0,
    left: horizontalDifference / 2,
    right: horizontalDifference / 2
  }

  // Canvas = trim insert + bleed on every edge. The preview frame matches this canvas, and
  // the trim / safe / holder guides are inset back in as a fraction of the canvas.
  const canvasWidth = insertSize.width + BLEED_INCHES * 2
  const canvasHeight = insertSize.height + BLEED_INCHES * 2
  const aspectRatio = canvasWidth / canvasHeight

  const bleedFracX = (BLEED_INCHES / canvasWidth) * 100
  const bleedFracY = (BLEED_INCHES / canvasHeight) * 100
  const safeFracX = (SAFE_INCHES / canvasWidth) * 100
  const safeFracY = (SAFE_INCHES / canvasHeight) * 100

  const previewFrameStyle = {
    '--sign-aspect': aspectRatio,
    '--bleed-x': `${bleedFracX}%`,
    '--bleed-y': `${bleedFracY}%`,
    '--safe-x': `${safeFracX}%`,
    '--safe-y': `${safeFracY}%`,
    // Holder bars are measured against the trim insert, so they live inside the trim box.
    '--holder-bar-top': `${(Math.max(viewableOffset.top, 0) / insertSize.height) * 100}%`,
    '--holder-bar-bottom': `${(Math.max(viewableOffset.bottom, 0) / insertSize.height) * 100}%`,
    '--holder-bar-left': `${(Math.max(viewableOffset.left, 0) / insertSize.width) * 100}%`,
    '--holder-bar-right': `${(Math.max(viewableOffset.right, 0) / insertSize.width) * 100}%`
  }

  const measurementSummary = [
    {
      label: 'Print (with bleed)',
      value: `${formatInches(canvasWidth)}" × ${formatInches(canvasHeight)}"`
    },
    {
      label: 'Trim / insert',
      value: `${formatInches(insertSize.width)}" × ${formatInches(insertSize.height)}"`
    },
    ...(selectedCardHolder ? [{
      label: 'Viewable',
      value: `${formatInches(viewableSize.width)}" × ${formatInches(viewableSize.height)}"`
    }] : [])
  ]

  return { insertSize, viewableSize, previewFrameStyle, measurementSummary }
}
