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
export const exportSignPNG = async (source, { insertSize, fileName = 'unbc-door-sign.png' }) => {
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
    link.download = fileName
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  image.onerror = (error) => console.error('Error exporting PNG:', error)
  image.src = svgUrl
}

// Writes a print run to one PDF: each page is a sheet from printSheet.js (one card, or as many as
// fit) with its cards placed at 1:1, the cut lines drawn over them, crop marks in the margin and,
// where there's room, a footer with a 1" scale bar and a label. `pages` are
// [{ sheet, items: [{ node }] }], `node` being each card's artwork <svg>.
export const exportPrintRunPDF = async ({ pages, paperSize, fileName, showLabel, showScale, describePage }) => {
  if (!pages?.length) return

  try {
    const first = pages[0].sheet
    const doc = new jsPDF({ orientation: first.orientation, unit: 'pt', format: paperSize })
    const availableFonts = await registerArtworkFonts(doc)

    for (const [pageIndex, { sheet, items }] of pages.entries()) {
      if (pageIndex > 0) doc.addPage(paperSize, sheet.orientation)
      // jsPDF's own sheet sizes are authoritative (A4 is metric); centre on them.
      const dx = (doc.internal.pageSize.getWidth() - sheet.pageWidth) / 2
      const dy = (doc.internal.pageSize.getHeight() - sheet.pageHeight) / 2
      const { width: W, height: H, bleed: B } = sheet.card

      for (const [index, { node }] of items.entries()) {
        const slot = sheet.slots[index]
        // svg2pdf needs the node laid out in the document to resolve geometry/styles.
        const clone = cloneArtworkForExport(node, availableFonts)
        clone.setAttribute('width', W + B * 2)
        clone.setAttribute('height', H + B * 2)
        await inlineArtworkImages(clone)

        const holder = document.createElement('div')
        holder.style.cssText = 'position:fixed;left:-10000px;top:0;opacity:0;pointer-events:none;'
        holder.appendChild(clone)
        document.body.appendChild(holder)

        // Each card paints only its own part of the sheet: its trim, plus the bleed it keeps
        // (butted neighbours stop at the shared cut).
        doc.saveGraphicsState()
        doc.rect(slot.clip.x + dx, slot.clip.y + dy, slot.clip.width, slot.clip.height, null)
        doc.clip()
        doc.discardPath()
        try {
          await svg2pdf(clone, doc, { x: slot.x - B + dx, y: slot.y - B + dy, width: W + B * 2, height: H + B * 2 })
        } finally {
          doc.restoreGraphicsState()
          holder.remove()
        }
      }

      // Cut lines sit exactly on the cuts, over the artwork, and go with the offcuts.
      doc.setLineDashPattern([], 0)
      doc.setDrawColor(90, 90, 90)
      doc.setLineWidth(0.3)
      sheet.cutLines.forEach(([x1, y1, x2, y2]) => doc.line(x1 + dx, y1 + dy, x2 + dx, y2 + dy))

      // Crop marks in the margin, in line with every cut, clear of the bleed.
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      sheet.cropMarks.forEach(([x1, y1, x2, y2]) => doc.line(x1 + dx, y1 + dy, x2 + dx, y2 + dy))

      if (sheet.footer && (showLabel || showScale)) {
        const y = sheet.footer.baseline + dy
        let x = sheet.footer.left + dx
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(80, 80, 80)
        if (showScale) {
          // Measures exactly 1" when the sheet is printed at 100%.
          const barY = y - 2.5
          doc.setDrawColor(0, 0, 0)
          doc.setLineWidth(0.5)
          doc.line(x, barY, x + PT_PER_INCH, barY)
          ;[0, 0.25, 0.5, 0.75, 1].forEach((step) => {
            const tick = step === 0 || step === 1 ? 4 : step === 0.5 ? 3 : 2
            doc.line(x + step * PT_PER_INCH, barY - tick, x + step * PT_PER_INCH, barY)
          })
          doc.text('1 in — check at 100%', x + PT_PER_INCH + 4, y)
          x += PT_PER_INCH + 4 + doc.getTextWidth('1 in — check at 100%') + 12
        }
        if (showLabel && describePage) {
          const maxWidth = doc.internal.pageSize.getWidth() - x - sheet.footer.left
          const [line] = doc.splitTextToSize(describePage(pageIndex, pages.length, sheet), Math.max(maxWidth, 40))
          doc.text(line, x, y)
        }
      }
    }

    doc.save(fileName)
  } catch (error) {
    console.error('Error exporting PDF:', error)
  }
}
