import React, { useMemo } from 'react'
import { SignArtwork } from '../sign/SignArtwork'
import { buildSignContent } from '../sign/signContent'

// Compact, always-visible copy of the sign for phones and tablets, where the editor and the full
// preview are on separate tabs. It draws the trimmed card only (no bleed or guides) so it reads
// as the finished sign; tapping it opens the full preview with the export controls.
export const LivePreview = ({ signData, cardHolders, onOpenPreview, onHide }) => {
  const content = useMemo(
    () => buildSignContent(signData, { cardHolders, bleed: 0 }),
    [signData, cardHolders]
  )

  return (
    <div
      className="live-preview"
      style={{ '--live-preview-aspect': content.insert.width / content.insert.height }}
    >
      <button
        type="button"
        className="live-preview__sign"
        onClick={onOpenPreview}
        aria-label="Open the full preview and export options"
      >
        <SignArtwork content={content} />
      </button>
      <button type="button" className="live-preview__hide" onClick={onHide}>
        Hide
      </button>
    </div>
  )
}
