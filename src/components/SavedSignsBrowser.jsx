import React, { useEffect, useMemo, useRef, useState } from 'react'
import { SignArtwork } from '../sign/SignArtwork'
import { buildSignContent } from '../sign/signContent'
import {
  SIGN_TYPE_LABELS, countSignTypes, describeSignEntry, filterSignEntries
} from '../sign/signArchiveSearch'
import productionArchive from '../../data/door-sign-archive.json'

const SignThumbnail = ({ signData, cardHolders }) => {
  const content = useMemo(
    () => buildSignContent(signData, { cardHolders, bleed: 0 }),
    [signData, cardHolders]
  )

  return (
    <div className="archive-detail__sign" style={{ '--sign-aspect': content.insert.width / content.insert.height }}>
      <SignArtwork content={content} />
    </div>
  )
}

const EmptyState = ({ onLoadProduction, onChooseFile, onExportCurrent }) => (
  <div className="archive-empty">
    <div className="archive-empty__intro">
      <h2>Open saved signs</h2>
      <p>
        Load an archive to search it, preview each sign and step through them in the editor.
        Edits stay with each sign until you export.
      </p>
    </div>
    <div className="archive-sources">
      <button type="button" className="archive-source" onClick={onLoadProduction}>
        <span className="archive-source__title">Production archive</span>
        <span className="archive-source__text">
          {productionArchive.signs.length} signs transcribed from the UNBC print files.
        </span>
        <span className="archive-source__cta">Load archive</span>
      </button>
      <button type="button" className="archive-source" onClick={onChooseFile}>
        <span className="archive-source__title">Import JSON</span>
        <span className="archive-source__text">
          One sign or a whole archive exported from this app. You can also drop a file anywhere here.
        </span>
        <span className="archive-source__cta">Choose file</span>
      </button>
    </div>
    <p className="archive-empty__footer">
      Working on a sign right now?{' '}
      <button type="button" className="archive-text-btn" onClick={onExportCurrent}>
        Export the current sign as JSON
      </button>
    </p>
  </div>
)

export const SavedSignsBrowser = ({ archiveState, cardHolders, editorHref, onEditSign }) => {
  const {
    archive, signs, selectedId, selectedEntry, editedIds, message,
    loadProductionArchive, importFile, select, revertSelected, close, exportCurrent, exportArchive
  } = archiveState
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dragging, setDragging] = useState(false)

  const typeCounts = useMemo(() => countSignTypes(signs), [signs])
  const results = useMemo(
    () => filterSignEntries(signs, query, { signType: typeFilter }),
    [signs, query, typeFilter]
  )
  const activeIndex = results.findIndex(entry => entry.id === selectedId)

  // A new archive starts unfiltered.
  useEffect(() => {
    setQuery('')
    setTypeFilter('all')
  }, [archive?.loadedAt])

  useEffect(() => {
    if (!listRef.current || activeIndex < 0) return
    listRef.current.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleFileInput = async (event) => {
    await importFile(event.target.files?.[0])
    event.target.value = ''
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    importFile(event.dataTransfer.files?.[0])
  }

  const moveSelection = (delta) => {
    if (!results.length) return
    const next = activeIndex < 0
      ? (delta > 0 ? 0 : results.length - 1)
      : Math.min(Math.max(activeIndex + delta, 0), results.length - 1)
    select(results[next].id)
  }

  const handleListKeyDown = (event) => {
    const keys = { ArrowDown: 1, ArrowUp: -1, PageDown: 8, PageUp: -8 }
    if (event.key in keys) {
      event.preventDefault()
      moveSelection(keys[event.key])
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      if (results.length) select(results[event.key === 'Home' ? 0 : results.length - 1].id)
    } else if (event.key === 'Enter' && selectedEntry) {
      event.preventDefault()
      onEditSign()
    }
  }

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      moveSelection(event.key === 'ArrowDown' ? 1 : -1)
    } else if (event.key === 'Enter' && results.length) {
      event.preventDefault()
      if (activeIndex < 0) select(results[0].id)
      else onEditSign()
    }
  }

  const typeOptions = [
    { value: 'all', label: 'All', count: signs.length },
    ...Object.keys(SIGN_TYPE_LABELS)
      .filter(type => typeCounts[type])
      .map(type => ({ value: type, label: SIGN_TYPE_LABELS[type], count: typeCounts[type] }))
  ]

  return (
    <section
      className={`archive-browser ${dragging ? 'archive-browser--dragging' : ''}`}
      aria-labelledby="archive-browser-title"
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes('Files')) return
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false)
      }}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="application/json,.json"
        onChange={handleFileInput}
        tabIndex={-1}
        aria-label="Choose a door sign JSON archive"
      />

      {!archive ? (
        <EmptyState
          onLoadProduction={loadProductionArchive}
          onChooseFile={() => inputRef.current?.click()}
          onExportCurrent={exportCurrent}
        />
      ) : (
        <>
          <div className="archive-browser__toolbar">
            <div className="archive-browser__heading">
              <h2 id="archive-browser-title">{archive.title}</h2>
              <p>
                {signs.length} sign{signs.length === 1 ? '' : 's'}
                {editedIds.size > 0 && <> · <strong>{editedIds.size} edited</strong></>}
              </p>
            </div>
            <div className="archive-browser__actions">
              <button type="button" className="archive-btn" onClick={exportArchive}>
                Export archive
              </button>
              <button type="button" className="archive-btn archive-btn--secondary" onClick={() => inputRef.current?.click()}>
                Import…
              </button>
              <button type="button" className="archive-btn archive-btn--secondary" onClick={close}>
                Close
              </button>
            </div>
          </div>

          <div className="archive-browser__filters">
            <label className="archive-search">
              <span className="visually-hidden">Search signs</span>
              <svg className="archive-search__icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={query}
                placeholder="Search by name, room, department, email or holder…"
                aria-controls="archive-list"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </label>
            <div className="archive-type-filter" role="radiogroup" aria-label="Filter by sign type">
              {typeOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={typeFilter === option.value}
                  className={`archive-chip ${typeFilter === option.value ? 'active' : ''}`}
                  onClick={() => setTypeFilter(option.value)}
                >
                  {option.label}
                  <span className="archive-chip__count">{option.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="archive-browser__body">
            <div className="archive-list-wrap">
              <p className="archive-list__summary" aria-live="polite">
                {results.length === signs.length
                  ? `Showing all ${signs.length}`
                  : `${results.length} of ${signs.length} match`}
              </p>
              {results.length > 0 ? (
                <ul
                  id="archive-list"
                  className="archive-list"
                  role="listbox"
                  aria-label="Saved signs"
                  tabIndex={0}
                  ref={listRef}
                  aria-activedescendant={activeIndex >= 0 ? `archive-option-${results[activeIndex].id}` : undefined}
                  onKeyDown={handleListKeyDown}
                >
                  {results.map((entry, index) => (
                    <li
                      key={entry.id}
                      id={`archive-option-${entry.id}`}
                      data-index={index}
                      role="option"
                      aria-selected={entry.id === selectedId}
                      className={`archive-list__item ${entry.id === selectedId ? 'selected' : ''}`}
                      onClick={() => select(entry.id)}
                      onDoubleClick={() => onEditSign()}
                    >
                      <span className="archive-list__label">
                        {entry.label}
                        {editedIds.has(entry.id) && <span className="archive-edited-dot" title="Edited">Edited</span>}
                      </span>
                      <span className="archive-list__meta">{describeSignEntry(entry)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="archive-list archive-list--empty">
                  <p>No signs match your search.</p>
                  <button
                    type="button"
                    className="archive-text-btn"
                    onClick={() => { setQuery(''); setTypeFilter('all') }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            <aside className="archive-detail" aria-label="Selected sign">
              {selectedEntry ? (
                <>
                  <SignThumbnail signData={selectedEntry.signData} cardHolders={cardHolders} />
                  <div className="archive-detail__info">
                    <h3>{selectedEntry.label}</h3>
                    <p>{describeSignEntry(selectedEntry)}</p>
                    {selectedEntry.source && (
                      <p className="archive-detail__source">Source: {selectedEntry.source}</p>
                    )}
                    {selectedEntry.notes && <p className="archive-detail__notes">{selectedEntry.notes}</p>}
                  </div>
                  <div className="archive-detail__actions">
                    <a className="archive-btn archive-btn--large" href={editorHref} onClick={onEditSign}>
                      Edit in generator
                    </a>
                    <button type="button" className="archive-btn archive-btn--secondary" onClick={exportCurrent}>
                      Export this sign
                    </button>
                    {editedIds.has(selectedEntry.id) && (
                      <button type="button" className="archive-btn archive-btn--secondary" onClick={revertSelected}>
                        Revert edits
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p className="archive-detail__placeholder">Choose a sign to preview it.</p>
              )}
            </aside>
          </div>
        </>
      )}

      {message && <p className="archive-browser__message" role="status">{message}</p>}
      {dragging && <div className="archive-browser__drop" aria-hidden="true">Drop a JSON file to import it</div>}
    </section>
  )
}
