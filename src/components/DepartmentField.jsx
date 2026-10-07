import React, { useEffect, useRef, useState } from 'react'
import {
  EMPTY_DEPARTMENT_SELECTION,
  hasDepartmentSelection,
  searchDepartmentHierarchy,
  toDepartmentSelection
} from '@unbc/logo'
import { CustomSelect } from './CustomSelect'
import {
  DEPARTMENT_LEVELS,
  departmentAreaName,
  departmentChildren,
  resolveDepartmentPath,
  selectDepartmentLevel
} from '../sign/departmentPath'

// The department on the sign's header: a search across the whole list, and under it the chosen
// path, one level per line. Each level is a dropdown of the other choices at that level, so a
// sign can move to a sibling unit (or stop a level higher) without searching again. Changing a
// level clears the ones below it; the deepest level chosen is the one the sign prints.
export const DepartmentField = ({ departments, value, onChange }) => {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const searchRef = useRef(null)
  const results = searchDepartmentHierarchy(departments, query)

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (!searchRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const choose = (result) => {
    onChange(toDepartmentSelection(result))
    setQuery('')
    setOpen(false)
  }

  const { path, custom } = resolveDepartmentPath(departments, value)
  const hasSelection = hasDepartmentSelection(value)

  // A level shows once the one above it is chosen and has something under it; the first level
  // past the chosen path is offered as an optional next step.
  const levels = DEPARTMENT_LEVELS
    .map((level, depth) => ({ ...level, depth, options: depth <= path.length ? departmentChildren(departments, path.slice(0, depth)) : [] }))
    .filter(level => level.options.length > 0)
  const printedDepth = path.length - 1

  return (
    <>
      <div className="form-group department-search" ref={searchRef}>
        <label htmlFor="departmentSearch">Search departments</label>
        <input
          type="text"
          id="departmentSearch"
          className="search-input"
          placeholder="Search departments…"
          autoComplete="off"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(Boolean(event.target.value.trim()))
          }}
          onFocus={() => query.trim() && setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false)
            if (event.key === 'Enter' && results.length) {
              event.preventDefault()
              choose(results[0])
            }
          }}
        />
        {open && (
          <div className="search-results" role="listbox" aria-label="Matching departments">
            {results.length > 0 ? results.map((result) => (
              <div
                key={result.path}
                role="option"
                aria-selected="false"
                className="search-result-item"
                onMouseDown={(event) => {
                  event.preventDefault()
                  choose(result)
                }}
              >
                <div className="search-result-path">{result.subSub || result.sub}</div>
                <div className="search-result-detail">
                  {[result.typeName, result.main, result.subSub ? result.sub : ''].filter(Boolean).join(' → ')}
                </div>
              </div>
            )) : (
              <div className="search-result-item no-results">No departments found for “{query}”</div>
            )}
          </div>
        )}
      </div>

      <div className="department-selection-display department-levels">
        <div className="department-header">
          <div className="department-title">
            <strong>{hasSelection ? 'Selected department' : 'Or browse the list'}</strong>
          </div>
          {hasSelection && (
            <div className="department-actions">
              <button
                type="button"
                className="department-clear"
                onClick={() => onChange({ ...EMPTY_DEPARTMENT_SELECTION })}
                aria-label="Clear department (plain logo)"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {custom && (
          <div className="department-level-row department-level-row--custom">
            <span className="department-level-row__label">
              Department <span className="department-level-row__badge">On sign</span>
            </span>
            <span className="department-level-row__custom">{custom}</span>
            <span className="department-level-row__note">
              Saved with the sign but not in the UNBC list. Choose below to replace it.
            </span>
          </div>
        )}

        <ol className="department-level-list">
          {levels.map(({ key, label, depth, options }) => {
            const selected = path[depth] || ''
            const optional = depth >= 2
            return (
              <li key={key} className="department-level-row" style={{ '--depth': depth }}>
                <span className="department-level-row__label" id={`department-level-${key}`}>
                  {label}
                  {depth === printedDepth && <span className="department-level-row__badge">On sign</span>}
                </span>
                <CustomSelect
                  id={`department-level-${key}-select`}
                  ariaLabel={label}
                  value={selected}
                  placeholder={optional ? `None — optional` : `Choose ${label.toLowerCase()}…`}
                  options={[
                    ...(optional && selected ? [{ value: '', label: 'None' }] : []),
                    ...options.map(option => ({
                      value: option,
                      label: depth === 0 ? departmentAreaName(departments, option) : option
                    }))
                  ]}
                  onChange={(next) => onChange(selectDepartmentLevel(path, depth, next))}
                />
              </li>
            )
          })}
        </ol>
      </div>
    </>
  )
}
