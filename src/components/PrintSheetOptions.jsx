import React from 'react'
import { SegmentedControl } from './SegmentedControl'
import { Switch } from './Switch'

const GUIDE_OPTIONS = [
  { value: 'marks', label: 'Crop marks' },
  { value: 'lines', label: 'Cut lines' },
  { value: 'both', label: 'Both' },
  { value: 'none', label: 'None' }
]

const SPACING_OPTIONS = [
  { value: 'gap', label: <span title="Each card keeps its own bleed: two cuts between neighbours, and a slightly-off cut still lands on the card's own colour">Gap</span> },
  { value: 'butted', label: <span title="Cards touch: one cut between neighbours, but a slip shows a sliver of the next card">Butted</span> }
]

const Option = ({ id, label, children }) => (
  <div className="sheet-options__row">
    <span className="field-label" id={id}>{label}</span>
    {children}
  </div>
)

// The print-ready PDF's sheet: one card or as many as fit, filled with copies of this sign or
// with the sheet list (other signs, or variants of this one), the cut guides, and the footer.
export const PrintSheetOptions = ({
  options,
  setOption,
  capacity,
  entries,
  canAdd,
  onAddEntry,
  onRemoveEntry,
  onClearEntries,
  onShowSheet
}) => {
  const filling = options.layout === 'fill'
  const usingList = filling && options.fillWith === 'list'

  const layoutOptions = [
    { value: 'single', label: 'One card' },
    { value: 'fill', label: capacity > 1 ? `Fill sheet · ${capacity}` : 'Fill sheet' }
  ]
  const fillOptions = [
    { value: 'copies', label: 'Copies of this sign' },
    { value: 'list', label: `Sheet list · ${entries.length}` }
  ]

  return (
    <div className="sheet-options">
      <Option id="sheetLayoutLabel" label="Cards per sheet">
        <SegmentedControl
          name="sheetLayout"
          className="segmented--fill"
          options={layoutOptions}
          value={options.layout}
          onChange={(value) => setOption('layout', value)}
          aria-labelledby="sheetLayoutLabel"
        />
      </Option>

      {filling && (
        <Option id="sheetFillLabel" label="Fill with">
          <SegmentedControl
            name="sheetFill"
            className="segmented--fill"
            options={fillOptions}
            value={options.fillWith}
            onChange={(value) => setOption('fillWith', value)}
            aria-labelledby="sheetFillLabel"
          />
        </Option>
      )}

      {filling && capacity > 1 && (
        <Option id="sheetSpacingLabel" label="Between cards">
          <SegmentedControl
            name="sheetSpacing"
            className="segmented--fill"
            options={SPACING_OPTIONS}
            value={options.spacing}
            onChange={(value) => setOption('spacing', value)}
            aria-labelledby="sheetSpacingLabel"
          />
        </Option>
      )}

      <Option id="sheetGuidesLabel" label="Cut guides">
        <SegmentedControl
          name="sheetGuides"
          className="segmented--fill"
          options={GUIDE_OPTIONS}
          value={options.cutGuides}
          onChange={(value) => setOption('cutGuides', value)}
          aria-labelledby="sheetGuidesLabel"
        />
      </Option>

      <div className="sheet-options__switches">
        <Switch
          name="sheetShowScale"
          className="switch--compact"
          checked={options.showScale}
          onChange={(event) => setOption('showScale', event.target.checked)}
        >
          1" scale check
        </Switch>
        <Switch
          name="sheetShowLabel"
          className="switch--compact"
          checked={options.showLabel}
          onChange={(event) => setOption('showLabel', event.target.checked)}
        >
          Label in the margin
        </Switch>
      </div>

      {usingList ? (
        <div className="sheet-list">
          <div className="sheet-list__head">
            <span className="field-label">Sheet list</span>
            {entries.length > 0 && (
              <button type="button" className="text-btn text-btn--danger" onClick={onClearEntries}>Clear</button>
            )}
          </div>
          {entries.length > 0 ? (
            <ol className="sheet-list__items">
              {entries.map(entry => (
                <li key={entry.id} className="sheet-list__item">
                  <span className="sheet-list__label">{entry.label}</span>
                  <button
                    type="button"
                    className="sheet-list__remove"
                    onClick={() => onRemoveEntry(entry.id)}
                    aria-label={`Remove ${entry.label} from the sheet list`}
                    title="Remove"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="field-hint">Nothing on the list yet — copies of this sign print until you add some.</p>
          )}
          <button type="button" className="sheet-list__add" onClick={onAddEntry} disabled={!canAdd}>
            + Add this sign as it is now
          </button>
          <p className="field-hint">
            Each entry is a snapshot: change the sign (or open another saved sign) and add it again to
            print variants side by side. Cards of different sizes print on separate sheets.
          </p>
        </div>
      ) : (
        <button type="button" className="text-btn sheet-options__list-link" onClick={onAddEntry} disabled={!canAdd}>
          + Add this sign to a sheet list (print several signs or variants on one sheet)
        </button>
      )}

      {onShowSheet && (
        <button type="button" className="text-btn sheet-options__preview-link" onClick={onShowSheet}>
          See the sheet in the preview
        </button>
      )}
    </div>
  )
}
