import React, { useMemo, useState } from 'react'
import { SignArtwork } from '../sign/SignArtwork'
import { MAX_ROOM_NUMBER } from '../sign/customHolders'
import { resolveCardHolderGeometry, getPrintLayout, formatInches } from '../sign/signGeometry'
import { exportSignPNG, exportPrintRunPDF } from '../sign/signExport'
import { PAPER_ORDER, PAPER_DIMENSIONS } from '../sign/signConstants'
import { paginatePrintRun, resolvePrintSheet } from '../sign/printSheet'
import { buildSignContent } from '../sign/signContent'
import { renderArtworkNode } from '../sign/renderArtwork'
import { usePrintSheet } from '../hooks/usePrintSheet'
import { PrintSheetOptions } from './PrintSheetOptions'
import { SheetPreview } from './SheetPreview'
import { CardHolderSelector } from './CardHolderSelector'
import { SegmentedControl } from './SegmentedControl'
import { SignGuides } from './SignGuides'
import { DEFAULT_LINE_COLOR, HolderMockup, PLATE_STYLES, resolveHolderPlate } from './HolderMockup'
import { LineColorPicker } from './LineColorPicker'
import { ArchiveStepper } from './ArchiveNavigator'
import { ShareLinkButton } from './ShareLinkButton'

// Turns the print-fit result into a one-line caution shown above the export buttons. Returns
// null when the insert + bleed + crop marks all fit the chosen sheet at the required 1:1 scale.
const buildFitWarning = (layout, cutGuides) => {
  if (layout.fitsMarks || (cutGuides === 'none' && layout.fitsBleed)) return null
  const target = layout.recommendedPaperLabel
  if (!layout.fitsBleed) {
    return target
      ? `This insert is larger than the selected sheet and will be clipped. Switch to ${target} to print it full-size with crop marks.`
      : 'This insert is too large for the available sheets — print it at a commercial printer.'
  }
  return target
    ? `The artwork fits, but there's no room for crop marks on this sheet. Switch to ${target} for crop marks, or cut to the insert size by hand.`
    : "There's no room for crop marks on this sheet; cut to the insert size by hand."
}

// The sizes worth reading before printing, in the order you'd check them.
const SPEC_LABELS = {
  'Trim / insert': 'Insert',
  Viewable: 'Window',
  'Print (with bleed)': 'With bleed'
}

// Paper sizes as short segment labels; the full dimensions stay in the tooltip.
const PAPER_OPTIONS = PAPER_ORDER.map((key) => ({
  value: key,
  label: <span title={PAPER_DIMENSIONS[key].label}>{PAPER_DIMENSIONS[key].label.replace(/\s*\(.*\)$/, '')}</span>
}))

// What the preview shows: the artwork with print guides over it, the sign hanging in its holder,
// or the plain artwork.
const VIEW_OPTIONS = [
  { value: 'guides', label: 'Print guides' },
  { value: 'door', label: 'On the door' },
  { value: 'sheet', label: 'Sheet' },
  { value: 'plain', label: 'Plain' }
]

const fileSafe = text => (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)

// On the door: the sign as people see it, or with the frame see-through to show the whole cut
// card and the strip the frame hides.
const DOOR_OPTIONS = [
  { value: 'mounted', label: 'Mounted' },
  { value: 'see-through', label: 'See-through' }
]

const PLATE_OPTIONS = Object.entries(PLATE_STYLES).map(([value, { label }]) => ({ value, label }))

// The preview card (artwork, print guides, legend) and the print & export card (holder, sheet,
// downloads). They share the rendered artwork node, which both exporters read from.
export const SignPreview = ({
  signData,
  content,
  cardHolders,
  builtInHolderNames,
  onSaveCustomHolder,
  onDeleteCustomHolder,
  onUpdate,
  archiveState,
  editorHref,
  measuringSheetsHref,
  onOpenMeasuringSheets
}) => {
  const [paperSize, setPaperSize] = useState('letter')
  const [view, setView] = useState('guides')
  const [sheetPage, setSheetPage] = useState(0)
  const printSheet = usePrintSheet()
  const sheetOptions = printSheet.options
  // The plate (its style, line colour and room number) follows the holder preset; a pick in the
  // door view holds until the holder changes.
  const [plateChoice, setPlateChoice] = useState({ holder: null, style: null, lineColor: null, roomNumber: null })
  const [doorView, setDoorView] = useState('mounted')

  const selectedCardHolder = signData.cardHolderType ? cardHolders[signData.cardHolderType] : null
  const {
    insertSize,
    viewableSize,
    viewableOffset,
    previewFrameStyle,
    measurementSummary
  } = resolveCardHolderGeometry(selectedCardHolder)
  const showGuides = view === 'guides'

  const holderKey = signData.cardHolderType || ''
  const holderPlate = resolveHolderPlate(selectedCardHolder)
  const choice = plateChoice.holder === holderKey ? plateChoice : {}
  const plateStyle = choice.style || holderPlate.style
  const lineColor = choice.lineColor || holderPlate.lineColor || DEFAULT_LINE_COLOR
  // An emptied box is a choice too (no number on the plate), so only null falls back.
  const roomNumber = choice.roomNumber ?? selectedCardHolder?.roomNumber ?? ''
  const choosePlate = (change) => setPlateChoice(prev => ({
    ...(prev.holder === holderKey ? prev : { style: null, lineColor: null, roomNumber: null }),
    ...change,
    holder: holderKey
  }))
  const plateOptions = PLATE_OPTIONS.map(option => (
    selectedCardHolder && option.value === holderPlate.style
      ? { ...option, label: <span title="This holder's plate">{option.label} ★</span> }
      : option
  ))

  const doorNote = !selectedCardHolder
    ? 'No holder selected, so the whole insert shows. Pick a holder under Print & export to see what its frame hides.'
    : doorView === 'see-through'
      ? `Cut size ${formatInches(insertSize.width)}" × ${formatInches(insertSize.height)}" (dashed). The frame hides ${
        ['top', 'bottom', 'left', 'right']
          .filter(edge => viewableOffset[edge] > 0)
          .map(edge => `${formatInches(viewableOffset[edge])}" ${edge}`)
          .join(', ')
      }, leaving the ${formatInches(viewableSize.width)}" × ${formatInches(viewableSize.height)}" window.`
      : `Only the ${formatInches(viewableSize.width)}" × ${formatInches(viewableSize.height)}" window shows; the frame hides the rest of the insert.`

  const doorSignClass = [
    'door-sign',
    signData.signType || 'faculty',
    selectedCardHolder ? 'with-holder' : ''
  ].filter(Boolean).join(' ')

  const specs = Object.keys(SPEC_LABELS)
    .map(label => measurementSummary.find(item => item.label === label))
    .filter(Boolean)

  // The print run: this sign once, a sheet of copies of it, or the sheet list — laid out on as
  // many sheets as it takes (printSheet.js). The Sheet preview and the PDF both draw these pages.
  const sheetSettings = {
    paperSize,
    layout: sheetOptions.layout,
    spacing: sheetOptions.spacing,
    cutGuides: sheetOptions.cutGuides
  }
  const thisSheet = resolvePrintSheet({ ...sheetSettings, insertSize })
  const usingList = sheetOptions.layout === 'fill' && sheetOptions.fillWith === 'list' && printSheet.entries.length > 0
  const pages = useMemo(() => {
    const items = usingList
      ? printSheet.entries.map((entry) => {
        const entryContent = buildSignContent(entry.signData, { cardHolders })
        return { content: entryContent, insertSize: entryContent.insert }
      })
      : Array.from({ length: thisSheet.perSheet }, () => ({ content, insertSize }))
    return paginatePrintRun(items, sheetSettings)
  }, [usingList, printSheet.entries, cardHolders, content, insertSize, thisSheet.perSheet, paperSize, sheetOptions.layout, sheetOptions.spacing, sheetOptions.cutGuides])
  const currentPage = Math.min(sheetPage, pages.length - 1)

  const runTitle = usingList
    ? 'Sheet list'
    : content.roomName && !content.name ? content.roomName : content.name || content.roomName
  const printedOn = new Date().toISOString().slice(0, 10)
  const describePage = (index, total, sheet) => [
    runTitle,
    `${formatInches(sheet.card.width / 72)}" × ${formatInches(sheet.card.height / 72)}" cut`,
    sheet.perSheet > 1 ? `${sheet.perSheet} per sheet` : null,
    total > 1 ? `page ${index + 1} of ${total}` : null,
    `printed ${printedOn}`
  ].filter(Boolean).join(' · ')

  const fitWarning = sheetOptions.layout === 'fill' && !usingList
    ? (thisSheet.fits ? null : buildFitWarning(getPrintLayout({ insertSize, paperSize }), sheetOptions.cutGuides))
    : sheetOptions.layout === 'single'
      ? buildFitWarning(getPrintLayout({ insertSize, paperSize }), sheetOptions.cutGuides)
      : null

  const organizationPrefix = content.organization === 'nugss' ? 'nugss' : 'unbc'
  const handleExportPNG = () => exportSignPNG(renderArtworkNode(content), {
    insertSize,
    fileName: `${organizationPrefix}-door-sign${fileSafe(runTitle) ? `-${fileSafe(runTitle)}` : ''}.png`
  })
  const handleExportPDF = () => {
    // Draw each distinct sign once; copies share its artwork.
    const nodes = new Map()
    const nodeFor = (itemContent) => {
      if (!nodes.has(itemContent)) nodes.set(itemContent, renderArtworkNode(itemContent))
      return nodes.get(itemContent)
    }
    const run = pages.map(page => ({
      sheet: page.sheet,
      items: page.items.map(item => ({ node: nodeFor(item.content) }))
    }))
    const cards = pages.reduce((sum, page) => sum + page.items.length, 0)
    const name = usingList
      ? `${organizationPrefix}-door-signs-sheet-list`
      : cards > 1
        ? `${organizationPrefix}-door-signs-${fileSafe(runTitle) || signData.signType}-${cards}-up`
        : `${organizationPrefix}-door-sign-${fileSafe(runTitle) || signData.signType || 'custom'}`
    return exportPrintRunPDF({
      pages: run,
      paperSize,
      fileName: `${name}.pdf`,
      showLabel: sheetOptions.showLabel,
      showScale: sheetOptions.showScale,
      describePage
    })
  }

  const cardCount = pages.reduce((sum, page) => sum + page.items.length, 0)
  const sheetSummary = `${cardCount} card${cardCount === 1 ? '' : 's'} on ${pages.length} ${PAPER_DIMENSIONS[paperSize].label.replace(/\s*\(.*\)$/, '')} sheet${pages.length === 1 ? '' : 's'}`

  return (
    <>
      <section className="output-card preview-card" aria-labelledby="preview-title">
        <header className="output-card__header">
          <h2 className="output-card__title" id="preview-title">Preview</h2>
          {archiveState?.archive && <ArchiveStepper archiveState={archiveState} compact />}
          <SegmentedControl
            name="previewView"
            className="segmented--compact"
            options={VIEW_OPTIONS}
            value={view}
            onChange={setView}
            aria-label="Preview"
          />
        </header>

        {view === 'door' ? (
          <div className="preview-stage preview-stage--door">
            <HolderMockup
              insertSize={insertSize}
              viewableOffset={selectedCardHolder ? viewableOffset : null}
              roomNumber={roomNumber}
              plateStyle={plateStyle}
              lineColor={lineColor}
              seeThrough={doorView === 'see-through'}
            >
              <SignArtwork content={content} />
            </HolderMockup>
          </div>
        ) : view === 'sheet' ? (
          <div className="preview-stage preview-stage--sheet">
            <SheetPreview
              page={pages[currentPage]}
              showLabel={sheetOptions.showLabel}
              showScale={sheetOptions.showScale}
              footerText={describePage(currentPage, pages.length, pages[currentPage].sheet)}
            />
          </div>
        ) : (
          <div className="preview-stage">
            <div
              className={`preview-frame ${selectedCardHolder ? 'with-holder' : 'without-holder'}`}
              style={previewFrameStyle}
            >
              <div className={doorSignClass}>
                <SignArtwork content={content} />
              </div>
              {showGuides && <SignGuides content={content} hasHolder={Boolean(selectedCardHolder)} />}
            </div>
          </div>
        )}

        {showGuides && (
          <div className="preview-legend" aria-hidden="true">
            <span className="preview-legend__item preview-legend__item--bleed">Bleed (trimmed off)</span>
            <span className="preview-legend__item preview-legend__item--trim">Cut line</span>
            {selectedCardHolder ? (
              <span className="preview-legend__item preview-legend__item--holder">Hidden by holder</span>
            ) : (
              <span className="preview-legend__item preview-legend__item--safe">Safe area</span>
            )}
            <span className="preview-legend__item preview-legend__item--margin">Margins</span>
          </div>
        )}

        {view === 'sheet' && (
          <div className="sheet-preview-footer">
            <p className="door-preview-note">
              {sheetSummary}. {sheetOptions.cutGuides === 'none'
                ? 'No cut guides — cut to the card size by hand.'
                : sheetOptions.cutGuides === 'marks'
                  ? 'Cut in line with the crop marks.'
                  : 'Cut along the grey lines.'} Set it up under Print & export.
            </p>
            {pages.length > 1 && (
              <div className="sheet-preview-pager">
                <button type="button" onClick={() => setSheetPage(currentPage - 1)} disabled={currentPage === 0} aria-label="Previous sheet">‹</button>
                <span>Sheet {currentPage + 1} of {pages.length}</span>
                <button type="button" onClick={() => setSheetPage(currentPage + 1)} disabled={currentPage === pages.length - 1} aria-label="Next sheet">›</button>
              </div>
            )}
          </div>
        )}

        {view === 'door' && (
          <div className="door-preview-footer">
            <p className="door-preview-note">{doorNote}</p>
            <div className="door-preview-controls">
              <SegmentedControl
                name="doorView"
                className="segmented--compact"
                options={DOOR_OPTIONS}
                value={doorView}
                onChange={setDoorView}
                aria-label="On the door"
              />
              <SegmentedControl
                name="plateStyle"
                className="segmented--compact"
                options={plateOptions}
                value={plateStyle}
                onChange={(style) => choosePlate({ style })}
                aria-label="Room plate"
              />
              {plateStyle === 'line' && (
                <LineColorPicker
                  name="doorLineColor"
                  value={lineColor}
                  onChange={(color) => choosePlate({ lineColor: color })}
                />
              )}
              <label className="door-preview-room">
                <span>Room no.</span>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => choosePlate({ roomNumber: e.target.value })}
                  placeholder="4-257"
                  maxLength={MAX_ROOM_NUMBER}
                />
              </label>
            </div>
          </div>
        )}
      </section>

      <section className="output-card export-card" aria-labelledby="export-title">
        <header className="output-card__header">
          <h2 className="output-card__title" id="export-title">Print &amp; export</h2>
        </header>

        <div className="export-card__layout">
          <div className="export-card__holder">
            <CardHolderSelector
              cardHolders={cardHolders}
              builtInHolderNames={builtInHolderNames}
              selectedType={signData.cardHolderType}
              onSaveCustom={onSaveCustomHolder}
              onDeleteCustom={onDeleteCustomHolder}
              onUpdate={(cardHolderType) => onUpdate({ cardHolderType })}
            />

            <dl className="print-specs">
              {specs.map(({ label, value }) => (
                <div key={label} className="print-specs__item">
                  <dt>{SPEC_LABELS[label]}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

            <PrintSheetOptions
              options={sheetOptions}
              setOption={printSheet.setOption}
              capacity={resolvePrintSheet({ ...sheetSettings, layout: 'fill', insertSize }).capacity}
              entries={printSheet.entries}
              canAdd={printSheet.canAdd}
              onAddEntry={() => printSheet.addEntry(signData)}
              onRemoveEntry={printSheet.removeEntry}
              onClearEntries={printSheet.clearEntries}
              onShowSheet={view === 'sheet' ? null : () => setView('sheet')}
            />
          </div>

          <div className="export-card__output">
            <div className="form-group paper-size-field">
              <span className="field-label" id="paperSizeLabel">Paper</span>
              <SegmentedControl
                name="paperSize"
                className="segmented--fill"
                options={PAPER_OPTIONS}
                value={paperSize}
                onChange={setPaperSize}
                aria-labelledby="paperSizeLabel"
              />
            </div>

            {fitWarning && (
              <p className="print-fit-warning" role="alert">{fitWarning}</p>
            )}

            <div className="export-buttons">
              <button type="button" onClick={handleExportPDF} className="export-btn">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" /></svg>
                Print-ready PDF
              </button>
              <button type="button" onClick={handleExportPNG} className="export-btn export-btn--secondary">
                PNG image
              </button>
            </div>

            <ShareLinkButton signData={signData} editorHref={editorHref} />
          </div>
        </div>

        <p className="export-card__footnote">
          Print the PDF at 100% (“Actual size”). Checking a holder?{' '}
          <a href={measuringSheetsHref} onClick={onOpenMeasuringSheets}>Measuring sheets</a>{' '}
          prints a 1:1 template or a grid to measure one.
        </p>
      </section>
    </>
  )
}
