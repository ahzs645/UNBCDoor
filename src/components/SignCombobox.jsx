import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { describeSignEntry, filterSignEntries } from '../sign/signArchiveSearch'

/**
 * Searchable picker for a loaded sign archive (ARIA 1.2 combobox with a listbox popup).
 * Closed, it reads as the selected sign; focusing it opens the full list and typing filters it
 * by name, room, department, email or holder. Arrow keys move, Enter picks, Escape backs out.
 */
export const SignCombobox = ({
  entries,
  selectedId,
  onSelect,
  editedIds,
  id,
  ariaLabel,
  placeholder = 'Search signs…'
}) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const reactId = useId()
  const baseId = id || `sign-combobox-${reactId}`
  const listboxId = `${baseId}-listbox`

  const selectedEntry = entries.find(entry => entry.id === selectedId)
  const results = useMemo(() => filterSignEntries(entries, query), [entries, query])

  const openList = () => {
    if (open) return
    setQuery('')
    setActiveIndex(Math.max(0, entries.findIndex(entry => entry.id === selectedId)))
    setOpen(true)
  }

  const closeList = () => {
    setOpen(false)
    setQuery('')
    setActiveIndex(-1)
  }

  const commit = (entry) => {
    if (entry) onSelect(entry.id)
    closeList()
  }

  // After Enter or Escape the input still has focus and shows the selected label again; select it
  // so the next keystroke starts a fresh search instead of appending to the label.
  useEffect(() => {
    if (!open && document.activeElement === inputRef.current) inputRef.current.select()
  }, [open, selectedId])

  useEffect(() => {
    if (!open || activeIndex < 0 || !listRef.current) return
    const node = listRef.current.querySelector(`[data-index="${activeIndex}"]`)
    if (node) node.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!open) openList()
        else setActiveIndex(index => Math.min(index + 1, results.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!open) openList()
        else setActiveIndex(index => Math.max(index - 1, 0))
        break
      case 'PageDown':
        if (open) {
          event.preventDefault()
          setActiveIndex(index => Math.min(index + 8, results.length - 1))
        }
        break
      case 'PageUp':
        if (open) {
          event.preventDefault()
          setActiveIndex(index => Math.max(index - 8, 0))
        }
        break
      case 'Enter':
        if (open) {
          event.preventDefault()
          commit(results[activeIndex])
        }
        break
      case 'Escape':
        if (open) {
          event.preventDefault()
          closeList()
        }
        break
      default:
        break
    }
  }

  const activeEntry = open ? results[activeIndex] : null

  return (
    <div className={`sign-combobox ${open ? 'sign-combobox--open' : ''}`}>
      <svg className="sign-combobox__icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        ref={inputRef}
        id={baseId}
        className="sign-combobox__input"
        type="text"
        role="combobox"
        autoComplete="off"
        spellCheck="false"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeEntry ? `${baseId}-option-${activeIndex}` : undefined}
        value={open ? query : (selectedEntry?.label || '')}
        placeholder={open && selectedEntry ? selectedEntry.label : placeholder}
        onFocus={openList}
        onClick={openList}
        onBlur={closeList}
        onKeyDown={handleKeyDown}
        onChange={(event) => {
          if (!open) setOpen(true)
          setQuery(event.target.value)
          setActiveIndex(0)
        }}
      />

      <div className="sign-combobox__panel" hidden={!open}>
        <ul
          className="sign-combobox__list"
          id={listboxId}
          role="listbox"
          ref={listRef}
          aria-label={ariaLabel}
        >
          {open && results.map((entry, index) => {
            const isSelected = entry.id === selectedId
            return (
              <li
                key={entry.id}
                id={`${baseId}-option-${index}`}
                data-index={index}
                role="option"
                aria-selected={isSelected}
                className={[
                  'sign-combobox__option',
                  index === activeIndex ? 'sign-combobox__option--active' : '',
                  isSelected ? 'sign-combobox__option--selected' : ''
                ].join(' ')}
                onMouseMove={() => setActiveIndex(index)}
                // Keep focus in the input so the blur handler doesn't close the list first.
                onMouseDown={(event) => {
                  event.preventDefault()
                  commit(entry)
                  inputRef.current?.blur()
                }}
              >
                <span className="sign-combobox__label">
                  {entry.label}
                  {editedIds?.has(entry.id) && <span className="archive-edited-dot" title="Edited">Edited</span>}
                </span>
                <span className="sign-combobox__meta">{describeSignEntry(entry)}</span>
              </li>
            )
          })}
        </ul>
        {open && results.length === 0 && (
          <p className="sign-combobox__empty">No signs match “{query.trim()}”.</p>
        )}
        {open && (
          <p className="sign-combobox__footer" aria-live="polite">
            {query.trim()
              ? `${results.length} of ${entries.length} signs match`
              : `${entries.length} signs · type to search`}
          </p>
        )}
      </div>
    </div>
  )
}
