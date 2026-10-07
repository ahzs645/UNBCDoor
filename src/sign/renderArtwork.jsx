import React from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { SignArtwork } from './SignArtwork'

// Draws a sign's artwork off screen and hands back its <svg>, for the exporters. They used to read
// the preview's own node, but a print run can hold signs that aren't on screen (the sheet list),
// and the preview may be showing the sheet rather than the sign.
export const renderArtworkNode = (content) => {
  const container = document.createElement('div')
  const root = createRoot(container)
  try {
    flushSync(() => root.render(<SignArtwork content={content} />))
    return container.querySelector('svg').cloneNode(true)
  } finally {
    root.unmount()
  }
}
