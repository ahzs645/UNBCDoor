import React, { useEffect, useRef, useState } from 'react'
import { buildSignShareUrl } from '../sign/signShare'

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6" />
    <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
  </svg>
)

// Phones and tablets get the system share sheet; elsewhere the link goes on the clipboard. If
// neither is available (or allowed), the link is shown so it can be copied by hand.
const prefersShareSheet = () =>
  typeof navigator.share === 'function' && window.matchMedia?.('(pointer: coarse)').matches

export const ShareLinkButton = ({ signData, editorHref }) => {
  const [status, setStatus] = useState(null)
  const [manualUrl, setManualUrl] = useState('')
  const manualRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  useEffect(() => {
    if (manualUrl) manualRef.current?.select()
  }, [manualUrl])

  // The link describes the sign as it was when made; drop a stale one once the sign changes.
  useEffect(() => {
    setManualUrl('')
  }, [signData])

  const flash = (message) => {
    setStatus(message)
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setStatus(null), 3000)
  }

  const handleShare = async () => {
    let url
    try {
      url = await buildSignShareUrl(signData, new URL(editorHref, window.location.href).href)
    } catch (error) {
      flash('This sign is too long to fit in a link — export it as JSON from Saved signs instead.')
      return
    }

    if (prefersShareSheet()) {
      try {
        await navigator.share({ title: signData.name || signData.roomName || 'UNBC door sign', url })
        return
      } catch (error) {
        if (error?.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setManualUrl('')
      flash('Link copied — anyone who opens it gets this sign in the editor.')
    } catch (error) {
      setManualUrl(url)
      flash('Copy the link below.')
    }
  }

  return (
    <div className="share-link">
      <button type="button" className="export-btn export-btn--ghost" onClick={handleShare}>
        <LinkIcon />
        Copy share link
      </button>
      {manualUrl && (
        <input
          ref={manualRef}
          className="share-link__url"
          type="text"
          readOnly
          value={manualUrl}
          aria-label="Share link"
          onFocus={(event) => event.target.select()}
        />
      )}
      <p className="share-link__status" role="status" aria-live="polite">{status}</p>
    </div>
  )
}
