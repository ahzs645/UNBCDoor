import romanFontUrl from '../../Fonts/HelveticaNeueRoman.otf'
import italicFontUrl from '../../Fonts/HelveticaNeueItalic.ttf'
import boldFontUrl from '../../Fonts/HelveticaNeueBold.ttf'
import blackFontUrl from '../../Fonts/HelveticaNeueBlack.ttf'

// svg2pdf can't reliably select all Helvetica Neue faces through jsPDF's standard Helvetica.
// Embed the true italic, bold, and black brand faces and address each by its own family name,
// which keeps preview, PNG, and PDF typography consistent and selectable.
export const ARTWORK_ITALIC_FAMILY = 'hnitalic'
export const ARTWORK_BOLD_FAMILY = 'hnbold'
export const ARTWORK_BLACK_FAMILY = 'hnblack'

const EMBEDDED_FONTS = [
  { url: italicFontUrl, vfs: 'HelveticaNeueItalic.ttf', family: ARTWORK_ITALIC_FAMILY },
  { url: boldFontUrl, vfs: 'HelveticaNeueBold.ttf', family: ARTWORK_BOLD_FAMILY },
  { url: blackFontUrl, vfs: 'HelveticaNeueBlack.ttf', family: ARTWORK_BLACK_FAMILY }
]

const SVG_FONTS = [
  { url: romanFontUrl, format: 'opentype', weight: 400, style: 'normal' },
  { url: italicFontUrl, format: 'truetype', weight: 400, style: 'italic' },
  { url: boldFontUrl, format: 'truetype', weight: 700, style: 'normal' },
  { url: blackFontUrl, format: 'truetype', weight: 900, style: 'normal' }
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

// A standalone SVG loaded through an <img> cannot see the page's @font-face rules. Embed the
// same files directly in PNG exports so browser preview and raster output use identical faces.
export const getEmbeddedArtworkFontCss = async () => {
  const faces = await Promise.all(SVG_FONTS.map(async (font) => {
    const base64 = await loadBase64(font.url)
    return `@font-face{font-family:'HelveticaNeueUNBC';src:url(data:font/${font.format};base64,${base64}) format('${font.format}');font-weight:${font.weight};font-style:${font.style};}`
  }))
  return faces.join('\n')
}
