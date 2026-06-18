import italicFontUrl from '../../Fonts/HelveticaNeueItalic.ttf'
import blackFontUrl from '../../Fonts/HelveticaNeueBlack.ttf'

// svg2pdf can't reliably drive jsPDF's standard-Helvetica italic, and standard Helvetica has
// no Black weight at all — so we embed the real brand faces and reference them by family name,
// which sidesteps svg2pdf's style logic and gives true brand fidelity (and selectable text).
// Upright regular/bold stay on built-in Helvetica to keep the PDF light.
export const ARTWORK_ITALIC_FAMILY = 'hnitalic'
export const ARTWORK_BLACK_FAMILY = 'hnblack'

const EMBEDDED_FONTS = [
  { url: italicFontUrl, vfs: 'HelveticaNeueItalic.ttf', family: ARTWORK_ITALIC_FAMILY },
  { url: blackFontUrl, vfs: 'HelveticaNeueBlack.ttf', family: ARTWORK_BLACK_FAMILY }
]

const base64Cache = new Map()

const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

const loadBase64 = (url) => {
  if (!base64Cache.has(url)) {
    base64Cache.set(url, fetch(url).then((response) => response.arrayBuffer()).then(toBase64))
  }
  return base64Cache.get(url)
}

// Registers the embedded brand faces on a jsPDF document. Returns a map of which families are
// available (each entry is the family name, or absent if that font failed to load).
export const registerArtworkFonts = async (doc) => {
  const available = {}
  for (const font of EMBEDDED_FONTS) {
    try {
      const base64 = await loadBase64(font.url)
      doc.addFileToVFS(font.vfs, base64)
      doc.addFont(font.vfs, font.family, 'normal')
      available[font.family] = font.family
    } catch (error) {
      console.error(`Could not register brand font "${font.family}":`, error)
    }
  }
  return available
}
