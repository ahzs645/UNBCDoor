// The sign's typeface is Helvetica Neue LT Pro (Fonts/HelveticaNeueLTPro-*, built by
// tools/build_brand_fonts.py), the cut UNBC's own documents are set in. It has about 380
// characters; the older Helvetica Neue faces stand in for anything else, in the browser through
// the CSS font stack and in the exports below.
import romanFontUrl from '../../Fonts/HelveticaNeueLTPro-Roman.otf'
import italicFontUrl from '../../Fonts/HelveticaNeueLTPro-Italic.otf'
import boldFontUrl from '../../Fonts/HelveticaNeueLTPro-Bold.otf'
import blackFontUrl from '../../Fonts/HelveticaNeueLTPro-Black.otf'
import italicPdfFontUrl from '../../Fonts/HelveticaNeueLTPro-Italic.ttf'
import boldPdfFontUrl from '../../Fonts/HelveticaNeueLTPro-Bold.ttf'
import blackPdfFontUrl from '../../Fonts/HelveticaNeueLTPro-Black.ttf'
import fallbackRomanFontUrl from '../../Fonts/HelveticaNeueRoman.otf'
import fallbackItalicFontUrl from '../../Fonts/HelveticaNeueItalic.ttf'
import fallbackBoldFontUrl from '../../Fonts/HelveticaNeueBold.otf'
import fallbackBlackFontUrl from '../../Fonts/HelveticaNeueBlack.otf'
import fallbackBoldPdfFontUrl from '../../Fonts/HelveticaNeueBold.ttf'
import fallbackBlackPdfFontUrl from '../../Fonts/HelveticaNeueBlack.ttf'
import { BRAND_FACE_COVERAGE } from './brandFontCoverage.js'

// svg2pdf can't reliably select all Helvetica Neue faces through jsPDF's standard Helvetica.
// Embed the true italic, bold, and black brand faces and address each by its own family name,
// which keeps preview, PNG, and PDF typography consistent and selectable.
export const ARTWORK_ITALIC_FAMILY = 'hnitalic'
export const ARTWORK_BOLD_FAMILY = 'hnbold'
export const ARTWORK_BLACK_FAMILY = 'hnblack'

// Each embedded face: the LT Pro face, and the older face text falls back to when LT Pro lacks
// one of its characters.
const PDF_FACES = {
  [ARTWORK_ITALIC_FAMILY]: {
    face: 'italic',
    brand: { url: italicPdfFontUrl, vfs: 'HelveticaNeueLTPro-Italic.ttf' },
    fallback: { family: 'hnitalicfb', url: fallbackItalicFontUrl, vfs: 'HelveticaNeueItalic.ttf' }
  },
  [ARTWORK_BOLD_FAMILY]: {
    face: 'bold',
    brand: { url: boldPdfFontUrl, vfs: 'HelveticaNeueLTPro-Bold.ttf' },
    fallback: { family: 'hnboldfb', url: fallbackBoldPdfFontUrl, vfs: 'HelveticaNeueBold.ttf' }
  },
  [ARTWORK_BLACK_FAMILY]: {
    face: 'black',
    brand: { url: blackPdfFontUrl, vfs: 'HelveticaNeueLTPro-Black.ttf' },
    fallback: { family: 'hnblackfb', url: fallbackBlackPdfFontUrl, vfs: 'HelveticaNeueBlack.ttf' }
  }
}

const covers = (face, text) => {
  const runs = BRAND_FACE_COVERAGE[face]
  return [...text].every((character) => {
    const code = character.codePointAt(0)
    return runs.some(([first, last]) => code >= first && code <= last)
  })
}

// The embedded family a run of text should be set in: the LT Pro face when it has every
// character, otherwise the older face.
export const pdfFamilyForText = (family, text) => {
  const entry = PDF_FACES[family]
  if (!entry) return family
  return covers(entry.face, text) ? family : entry.fallback.family
}

// jsPDF draws text character by character, so it never applies a font's 'liga' feature. With
// ligatures on, the export writes them as their Unicode characters instead, and only the ones
// each face's own 'liga' makes (the browser draws the same glyphs for the preview). The LT Pro
// faces have fi and fl; of the older ones, Black has ff/ffi/ffl and Bold and Italic all five. Roman text
// goes out in jsPDF's standard Helvetica, which has no ligatures at all.
const LIGATURE_CHARACTERS = { ffi: 'ﬃ', ffl: 'ﬄ', ff: 'ﬀ', fi: 'ﬁ', fl: 'ﬂ' }
const FACE_LIGATURES = {
  [ARTWORK_ITALIC_FAMILY]: ['fi', 'fl'],
  [ARTWORK_BOLD_FAMILY]: ['fi', 'fl'],
  [ARTWORK_BLACK_FAMILY]: ['fi', 'fl'],
  hnitalicfb: ['ffi', 'ffl', 'ff', 'fi', 'fl'],
  hnboldfb: ['ffi', 'ffl', 'ff', 'fi', 'fl'],
  hnblackfb: ['ffi', 'ffl', 'ff']
}

export const applyFaceLigatures = (text, family) => {
  const sequences = FACE_LIGATURES[family]
  if (!sequences) return text
  return text.replace(new RegExp(sequences.join('|'), 'g'), sequence => LIGATURE_CHARACTERS[sequence])
}

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

const register = async (doc, { url, vfs }, family) => {
  try {
    doc.addFileToVFS(vfs, await loadBase64(url))
    doc.addFont(vfs, family, 'normal')
    return true
  } catch (error) {
    console.error(`Could not register brand font "${family}":`, error)
    return false
  }
}

// Registers the embedded brand faces on a jsPDF document, and the older faces named in
// `fallbackFamilies` (only those some text needs, so a sign without unusual characters doesn't
// carry them). Returns a map of which families are available (each entry is the family name, or
// absent if that font failed to load).
export const registerArtworkFonts = async (doc, fallbackFamilies = []) => {
  const available = {}
  for (const [family, { brand, fallback }] of Object.entries(PDF_FACES)) {
    if (await register(doc, brand, family)) available[family] = family
    if (fallbackFamilies.includes(fallback.family) && await register(doc, fallback, fallback.family)) {
      available[fallback.family] = fallback.family
    }
  }
  return available
}

const SVG_FONTS = [
  { url: romanFontUrl, format: 'opentype', weight: 400, style: 'normal' },
  { url: italicFontUrl, format: 'opentype', weight: 400, style: 'italic' },
  { url: boldFontUrl, format: 'opentype', weight: 700, style: 'normal' },
  { url: blackFontUrl, format: 'opentype', weight: 900, style: 'normal' }
]

const SVG_FALLBACK_FONTS = [
  { url: fallbackRomanFontUrl, format: 'opentype', weight: 400, style: 'normal' },
  { url: fallbackItalicFontUrl, format: 'truetype', weight: 400, style: 'italic' },
  { url: fallbackBoldFontUrl, format: 'opentype', weight: 700, style: 'normal' },
  { url: fallbackBlackFontUrl, format: 'opentype', weight: 900, style: 'normal' }
]

const faceRules = (fonts, family) => Promise.all(fonts.map(async (font) => {
  const base64 = await loadBase64(font.url)
  return `@font-face{font-family:'${family}';src:url(data:font/${font.format};base64,${base64}) format('${font.format}');font-weight:${font.weight};font-style:${font.style};}`
}))

// A standalone SVG loaded through an <img> cannot see the page's @font-face rules. Embed the
// same files directly in PNG exports so browser preview and raster output use identical faces.
// The older faces (large) only come along when `text` has a character LT Pro lacks.
export const getEmbeddedArtworkFontCss = async (text = '') => {
  const rules = await faceRules(SVG_FONTS, 'HelveticaNeueUNBC')
  if (!covers('roman', text.replace(/\s/g, ''))) {
    rules.push(...await faceRules(SVG_FALLBACK_FONTS, 'HelveticaNeueUNBCFallback'))
  }
  return rules.join('\n')
}
