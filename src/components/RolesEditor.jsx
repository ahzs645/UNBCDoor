import React, { useState } from 'react'
import { SegmentedControl } from './SegmentedControl'
import { EMPTY_ROLE, hasTitleSeparator, separateRoleUnit } from '../sign/signRoles'

const UNIT_LAYOUT_OPTIONS = [
  { value: 'beside', label: 'Beside |' },
  { value: 'below', label: 'Own line' },
  { value: 'hidden', label: 'Hide' }
]

const UNIT_DIVIDER_OPTIONS = [
  { value: 'bar', label: 'Show |' },
  { value: 'none', label: 'Hide |' }
]

const TITLE_LAYOUT_OPTIONS = [
  { value: 'stacked', label: 'Split at | · ;' },
  { value: 'inline', label: 'As typed' }
]

const move = (list, from, to) => {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// Text after the first bar, for the "Separate" button's label.
const unitAfterBar = (title) => title.slice(title.indexOf('|') + 1).replace(/\s+/g, ' ').trim()

const RoleOption = ({ id, label, ...controlProps }) => (
  <div className="role-card__option">
    <span className="role-card__option-label" id={`${id}-label`}>{label}</span>
    <SegmentedControl className="segmented--compact" aria-labelledby={`${id}-label`} {...controlProps} />
  </div>
)

// Every job the person holds, one card each, in the order they print. Each pairs a position with
// the faculty or department it belongs to — printed beside it after a bar, on a line of its own,
// or not at all — and can carry a line of italic subtext. With nothing entered the editor still
// shows one empty card, so it reads as the plain Position field it replaced.
export const RolesEditor = ({ id, roles = [], onChange, placeholder = 'e.g. Associate Professor' }) => {
  // Subtext fields opened but still empty; ones with text always show.
  const [openNotes, setOpenNotes] = useState(() => new Set())
  const rows = roles.length ? roles : [EMPTY_ROLE]

  const update = (index, patch) => onChange(rows.map((role, i) => (i === index ? { ...role, ...patch } : role)))
  const reorder = (next) => {
    setOpenNotes(new Set())
    onChange(next)
  }
  const remove = (index) => reorder(rows.length > 1 ? rows.filter((_, i) => i !== index) : [])

  return (
    <div className="form-group roles-editor" role="group" aria-labelledby={`${id}-label`}>
      <span className="field-label" id={`${id}-label`}>Position</span>
      <ol className="roles-editor__list">
        {rows.map((role, index) => {
          const key = `${id}-${index}`
          const number = rows.length > 1 ? ` ${index + 1}` : ''
          const showNote = Boolean(role.note) || openNotes.has(index)
          const canSeparate = !role.unit && role.title.includes('|') && unitAfterBar(role.title)
          const isBlank = !role.title && !role.unit && !role.note
          return (
            <li key={index} className="role-card">
              <div className="role-card__fields">
                <textarea
                  id={`${key}-title`}
                  aria-label={`Position${number}`}
                  rows={1}
                  placeholder={index === 0 ? placeholder : 'Position — e.g. Director'}
                  autoComplete="off"
                  value={role.title}
                  onChange={(e) => update(index, { title: e.target.value })}
                />
                <input
                  type="text"
                  id={`${key}-unit`}
                  aria-label={`Position${number} faculty or department`}
                  placeholder="Faculty / department (optional)"
                  autoComplete="off"
                  value={role.unit}
                  onChange={(e) => update(index, { unit: e.target.value })}
                />
                <div className="roles-editor__actions">
                  {rows.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => reorder(move(rows, index, index - 1))}
                        disabled={index === 0}
                        aria-label={`Move position ${index + 1} up`}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => reorder(move(rows, index, index + 1))}
                        disabled={index === rows.length - 1}
                        aria-label={`Move position ${index + 1} down`}
                        title="Move down"
                      >
                        ↓
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={rows.length === 1 && isBlank}
                    aria-label={rows.length > 1 ? `Remove position ${index + 1}` : 'Clear the position'}
                    title={rows.length > 1 ? 'Remove' : 'Clear'}
                  >
                    ×
                  </button>
                </div>
              </div>

              {showNote && (
                <input
                  type="text"
                  id={`${key}-note`}
                  className="role-card__note"
                  aria-label={`Position${number} subtext, printed in italics`}
                  placeholder="Subtext in italics — e.g. Northern BC’s Environment & Climate Solutions Innovation Hub"
                  autoComplete="off"
                  value={role.note}
                  onChange={(e) => update(index, { note: e.target.value })}
                  autoFocus={!role.note}
                />
              )}

              {(canSeparate || role.unit || hasTitleSeparator(role.title) || !showNote) && (
                <div className="role-card__options">
                  {role.unit && (
                    <RoleOption
                      id={`${key}-unitLayout`}
                      label="Department"
                      name={`${key}-unitLayout`}
                      options={UNIT_LAYOUT_OPTIONS}
                      value={role.unitLayout || 'beside'}
                      onChange={(unitLayout) => update(index, { unitLayout })}
                    />
                  )}
                  {role.unit && (role.unitLayout || 'beside') === 'beside' && (
                    <RoleOption
                      id={`${key}-unitDivider`}
                      label="Divider"
                      name={`${key}-unitDivider`}
                      options={UNIT_DIVIDER_OPTIONS}
                      value={role.unitDivider || 'bar'}
                      onChange={(unitDivider) => update(index, { unitDivider })}
                    />
                  )}
                  {hasTitleSeparator(role.title) && (
                    <RoleOption
                      id={`${key}-titleLayout`}
                      label="Position"
                      name={`${key}-titleLayout`}
                      options={TITLE_LAYOUT_OPTIONS}
                      value={role.titleLayout || 'stacked'}
                      onChange={(titleLayout) => update(index, { titleLayout })}
                    />
                  )}
                  <div className="role-card__links">
                    {canSeparate && (
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => update(index, separateRoleUnit(role))}
                      >
                        Move “{unitAfterBar(role.title)}” to the department field
                      </button>
                    )}
                    {!showNote && (
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => setOpenNotes(open => new Set(open).add(index))}
                      >
                        + Subtext
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <button type="button" className="roles-editor__add" onClick={() => onChange([...rows, { ...EMPTY_ROLE }])}>
        + Add another position
      </button>
      <p className="field-hint">
        A department prints as “Position | Department” (or without the bar), on its own line, or
        not at all. Press Enter in a position for a line break you want kept on the sign.
      </p>
    </div>
  )
}
