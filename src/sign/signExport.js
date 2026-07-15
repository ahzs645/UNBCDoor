import { jsPDF } from 'jspdf'
import { svg2pdf } from 'svg2pdf.js'
import {
  registerArtworkFonts,
  getEmbeddedArtworkFontCss,
  ARTWORK_ITALIC_FAMILY,
  ARTWORK_BOLD_FAMILY,
  ARTWORK_BLACK_FAMILY
} from './pdfFonts'
import { PT_PER_INCH, BLEED_INCHES } from './signConstants'
import { getPrintLayout } from './signGeometry'

// Pure, non-React export helpers. Each takes the live artwork <svg> node plus the geometry
// it needs and triggers a browser download. Kept out of the React tree so the heavy
// DOM/canvas/jsPDF logic is testable and reusable.

// Clones the artwork and rewrites its font references for PDF embedding. The on-screen SVG
// leans on CSS font-style/weight; svg2pdf under jsPDF v3 needs explicit family mapping.
const cloneArtworkForExport = (source, availableFonts = {}) => {
  const clone = source.cloneNode(true)

  const italicFamily = availableFonts[ARTWORK_ITALIC_FAMILY]
  const boldFamily = availableFonts[ARTWORK_BOLD_FAMILY]
  const blackFamily = availableFonts[ARTWORK_BLACK_FAMILY]

  const useFamily = (node, family) => {
    // The embedded face already carries its weight/slant, so reference it as normal/normal.
    node.setAttribute('font-family', family)
    node.setAttribute('font-style', 'normal')
    node.setAttribute('font-weight', 'normal')
    node.style.fontFamily = family
    node.style.fontStyle = 'normal'
    node.style.fontWeight = 'normal'
  }

  // Italic, Bold, and Black route to the matching embedded Helvetica Neue faces. Roman text
  // stays on jsPDF's standard Helvetica for a small, crisp selectable base face.
  clone.setAttribute('font-family', 'helvetica')
  clone.querySelectorAll('text').forEach((node) => {
    const weight = parseInt(node.getAttribute('font-weight'), 10) || 400
    const isItalic = node.getAttribute('font-style') === 'italic'

    if (isItalic && italicFamily) return useFamily(node, italicFamily)
    if (weight >= 800 && blackFamily) return useFamily(node, blackFamily)
    if (weight >= 600 && boldFamily) return useFamily(node, boldFamily)

    // Standard Helvetica only has normal/bold — collapse other weights so svg2pdf matches
    // the face instead of silently falling back to Times.
    const fontWeight = weight >= 600 ? 'bold' : 'normal'
    node.setAttribute('font-family', 'helvetica')
    node.setAttribute('font-weight', fontWeight)
    node.setAttribute('font-style', 'normal')
    node.style.fontFamily = 'helvetica'
    node.style.fontWeight = fontWeight
    node.style.fontStyle = 'normal'
  })
  return clone
}

// Imported organization logos are normal same-origin assets in the live preview. Convert
// them to data URLs in the export clone so PNG data-SVGs and svg2pdf remain self-contained.
const inlineArtworkImages = async (svg) => {
  const images = [...svg.querySelectorAll('image')]
  await Promise.all(images.map(async (node) => {
    const href = node.getAttribute('href') || node.getAttribute('xlink:href')
    if (!href || href.startsWith('data:')) return
    const response = await fetch(href)
    if (!response.ok) throw new Error(`Could not load artwork image: ${href}`)
    const blob = await response.blob()
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    node.setAttribute('href', dataUrl)
  }))
}

// Rasterizes the artwork to a trimmed PNG (bleed cropped off, matching the finished cut).
export const exportSignPNG = async (source, { insertSize }) => {
  if (!source) return

  const [, , viewW, viewH] = (source.getAttribute('viewBox') || '0 0 612 396')
    .split(/\s+/)
    .map(Number)

  const bleedPt = BLEED_INCHES * PT_PER_INCH
  const trimW = insertSize.width * PT_PER_INCH
  const trimH = insertSize.height * PT_PER_INCH

  // Rasterize the artwork as-authored (keeps font-style italic for the browser to render).
  const clone = source.cloneNode(true)
  clone.setAttribute('width', viewW)
  clone.setAttribute('height', viewH)
  await inlineArtworkImages(clone)

  try {
    const defs = clone.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    if (!defs.parentNode) clone.prepend(defs)
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
    style.textContent = await getEmbeddedArtworkFontCss()
    defs.appendChild(style)
  } catch (error) {
    console.error('Could not embed brand fonts in PNG:', error)
  }

  const xml = new XMLSerializer().serializeToString(clone)
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`
  const scale = 4

  const image = new Image()
  image.onload = () => {
    // The PNG is the finished, trimmed insert — crop the bleed margin back off so it
    // matches what you get after cutting (the PDF keeps the bleed for the printer).
    const canvas = document.createElement('canvas')
    canvas.width = trimW * scale
    canvas.height = trimH * scale
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(
      image,
      bleedPt, bleedPt, trimW, trimH,
      0, 0, canvas.width, canvas.height
    )

    const link = document.createElement('a')
    link.download = 'unbc-door-sign.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  image.onerror = (error) => console.error('Error exporting PNG:', error)
  image.src = svgUrl
}

// Renders the artwork (with bleed) onto a print sheet and adds vector crop marks at the trim.
export const exportSignPDF = async (source, { insertSize, paperSize, signType }) => {
  if (!source) return

  try {
    // Orient the sheet to the insert so a landscape insert prints on the rotated page —
    // otherwise wide inserts (e.g. the 8.5"×5.5" standard holder) overrun a portrait sheet
    // and lose their side bleed and crop marks off the page edge.
    const { orientation } = getPrintLayout({ insertSize, paperSize })

    const doc = new jsPDF({ orientation, unit: 'pt', format: paperSize })
    const availableFonts = await registerArtworkFonts(doc)

    // The artwork carries bleed on every edge; crop marks below pin the trim (cut) line.
    const bleedPt = BLEED_INCHES * PT_PER_INCH
    const trimW = insertSize.width * PT_PER_INCH
    const trimH = insertSize.height * PT_PER_INCH
    const artWidth = trimW + bleedPt * 2
    const artHeight = trimH + bleedPt * 2
    // Read the page size back from the oriented document so centering math matches the
    // sheet jsPDF actually produced (its A4/Legal/Tabloid sizes are authoritative).
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    // Center the TRIM box on the page; bleed extends outward from there. When the insert
    // is as wide as the sheet (e.g. 8.5" insert on Letter) the side bleed falls off the
    // page — expected, since the trim edge is then the paper edge.
    const xOffset = (pageWidth - trimW) / 2 - bleedPt
    const yOffset = (pageHeight - trimH) / 2 - bleedPt

    // svg2pdf needs the node laid out in the document to resolve geometry/styles.
    const clone = cloneArtworkForExport(source, availableFonts)
    clone.setAttribute('width', artWidth)
    clone.setAttribute('height', artHeight)
    await inlineArtworkImages(clone)

    const holder = document.createElement('div')
    holder.style.cssText = 'position:fixed;left:-10000px;top:0;opacity:0;pointer-events:none;'
    holder.appendChild(clone)
    document.body.appendChild(holder)

    try {
      await svg2pdf(clone, doc, { x: xOffset, y: yOffset, width: artWidth, height: artHeight })
    } finally {
      holder.remove()
    }

    // Vector crop marks aligned to the trim (cut) line, sitting in the margin just
    // outside the bleed so they never print on the live artwork (0.25" arms).
    const mark = 0.25 * PT_PER_INCH
    const ax0 = xOffset                 // artwork (bleed) edges
    const ay0 = yOffset
    const ax1 = xOffset + artWidth
    const ay1 = yOffset + artHeight
    const tx0 = xOffset + bleedPt        // trim (cut) lines
    const ty0 = yOffset + bleedPt
    const tx1 = ax1 - bleedPt
    const ty1 = ay1 - bleedPt

    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.75)

    // Horizontal arms in the left/right margins, aligned to the trim top & bottom.
    doc.line(ax0 - mark, ty0, ax0, ty0)
    doc.line(ax1, ty0, ax1 + mark, ty0)
    doc.line(ax0 - mark, ty1, ax0, ty1)
    doc.line(ax1, ty1, ax1 + mark, ty1)

    // Vertical arms in the top/bottom margins, aligned to the trim left & right.
    doc.line(tx0, ay0 - mark, tx0, ay0)
    doc.line(tx1, ay0 - mark, tx1, ay0)
    doc.line(tx0, ay1, tx0, ay1 + mark)
    doc.line(tx1, ay1, tx1, ay1 + mark)

    doc.save(`unbc-door-sign-${signType || 'custom'}.pdf`)
  } catch (error) {
    console.error('Error exporting PDF:', error)
  }
}
