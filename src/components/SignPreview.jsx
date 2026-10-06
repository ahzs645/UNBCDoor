import React, { useRef, useState } from 'react'
import { SignArtwork } from '../sign/SignArtwork'
import { resolveCardHolderGeometry, getPrintLayout, formatInches } from '../sign/signGeometry'
import { exportSignPNG, exportSignPDF } from '../sign/signExport'
import { PAPER_ORDER, PAPER_DIMENSIONS } from '../sign/signConstants'
import { CardHolderSelector } from './CardHolderSelector'
import { SegmentedControl } from './SegmentedControl'
import { SignGuides } from './SignGuides'
import { DEFAULT_LINE_COLOR, HolderMockup, PLATE_STYLES, resolveHolderPlate } from './HolderMockup'
import { LineColorPicker } from './LineColorPicker'
import { ArchiveStepper } from './ArchiveNavigator'
import { ShareLinkButton } from './ShareLinkButton'

// Turns the print-fit result into a one-line caution shown above the export buttons. Returns
// null when the insert + bleed + crop marks all fit the chosen sheet at the required 1:1 scale.
const buildFitWarning = (layout) => {
  if (layout.fitsMarks) return null
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
  { value: 'plain', label: 'Plain' }
]

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
  const signRef = useRef(null)
  const [paperSize, setPaperSize] = useState('letter')
  const [view, setView] = useState('guides')
  const [roomNumber, setRoomNumber] = useState('')
  // The plate (and its line colour) follows the holder preset; a pick in the door view holds
  // until the holder changes.
  const [plateChoice, setPlateChoice] = useState({ holder: null, style: null, lineColor: null })
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
  const choosePlate = (change) => setPlateChoice(prev => ({
    ...(prev.holder === holderKey ? prev : { style: null, lineColor: null }),
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

  const printLayout = getPrintLayout({ insertSize, paperSize })
  const fitWarning = buildFitWarning(printLayout)
  const specs = Object.keys(SPEC_LABELS)
    .map(label => measurementSummary.find(item => item.label === label))
    .filter(Boolean)

  const handleExportPNG = () => exportSignPNG(signRef.current, { insertSize })
  const handleExportPDF = () => exportSignPDF(signRef.current, {
    insertSize,
    paperSize,
    signType: signData.signType
  })

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
              <SignArtwork ref={signRef} content={content} />
            </HolderMockup>
          </div>
        ) : (
          <div className="preview-stage">
            <div
              className={`preview-frame ${selectedCardHolder ? 'with-holder' : 'without-holder'}`}
              style={previewFrameStyle}
            >
              <div className={doorSignClass}>
                <SignArtwork ref={signRef} content={content} />
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
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="4-257"
                  maxLength={8}
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
