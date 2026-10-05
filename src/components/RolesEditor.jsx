import React from 'react'

const EMPTY_ROLE = { title: '', unit: '' }

const move = (list, from, to) => {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// Several jobs at once: each role pairs a position with the faculty or department it belongs
// to, and prints as "Position | Department" under the main position line.
export const RolesEditor = ({ id, roles = [], onChange }) => {
  const update = (index, patch) => onChange(roles.map((role, i) => (i === index ? { ...role, ...patch } : role)))

  return (
    <div className="form-group roles-editor" role="group" aria-labelledby={`${id}-label`}>
      <span className="field-label" id={`${id}-label`}>Roles</span>
      {roles.length > 0 && (
        <ol className="roles-editor__list">
          {roles.map((role, index) => (
            <li key={index} className="roles-editor__row">
              <input
                type="text"
                id={`${id}-${index}-title`}
                aria-label={`Role ${index + 1} position`}
                placeholder="Position — e.g. Director"
                autoComplete="off"
                value={role.title}
                onChange={(e) => update(index, { title: e.target.value })}
              />
              <input
                type="text"
                id={`${id}-${index}-unit`}
                aria-label={`Role ${index + 1} faculty or department`}
                placeholder="Faculty / department"
                autoComplete="off"
                value={role.unit}
                onChange={(e) => update(index, { unit: e.target.value })}
              />
              <div className="roles-editor__actions">
                <button
                  type="button"
                  onClick={() => onChange(move(roles, index, index - 1))}
                  disabled={index === 0}
                  aria-label={`Move role ${index + 1} up`}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onChange(move(roles, index, index + 1))}
                  disabled={index === roles.length - 1}
                  aria-label={`Move role ${index + 1} down`}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => onChange(roles.filter((_, i) => i !== index))}
                  aria-label={`Remove role ${index + 1}`}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <button type="button" className="roles-editor__add" onClick={() => onChange([...roles, { ...EMPTY_ROLE }])}>
        + Add role
      </button>
      <p className="field-hint">
        Each role prints as “Position | Department”, e.g. Professor | Faculty of Environment.
      </p>
    </div>
  )
}
