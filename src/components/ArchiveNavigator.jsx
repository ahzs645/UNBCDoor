import React, { useRef } from 'react'
import { SignCombobox } from './SignCombobox'
import productionArchive from '../../data/door-sign-archive.json'

const Chevron = ({ direction }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
  </svg>
)

// Previous / next buttons around the current position, shared by the navigator and the
// preview card so a loaded archive can be stepped through from either.
export const ArchiveStepper = ({ archiveState, compact = false }) => {
  const { signs, selectedIndex, step } = archiveState

  return (
    <div className={`archive-stepper ${compact ? 'archive-stepper--compact' : ''}`}>
      <button
        type="button"
        className="archive-nav__step"
        onClick={() => step(-1)}
        disabled={selectedIndex <= 0}
        aria-label="Previous saved sign"
        title="Previous sign"
      >
        <Chevron direction="left" />
      </button>
      {compact && (
        <span className="archive-stepper__position">
          {selectedIndex >= 0 ? `${selectedIndex + 1} / ${signs.length}` : signs.length}
        </span>
      )}
      <button
        type="button"
        className="archive-nav__step"
        onClick={() => step(1)}
        disabled={selectedIndex < 0 || selectedIndex >= signs.length - 1}
        aria-label="Next saved sign"
        title="Next sign"
      >
        <Chevron direction="right" />
      </button>
    </div>
  )
}

// The editor's saved-signs bar. Before anything is loaded it offers the production archive or a
// JSON import; once an archive is open, any sign can be found by searching or stepped through in
// order. Edits stay attached to each entry, so going back and forth is safe.
export const ArchiveNavigator = ({ archiveState, browseHref, onBrowse }) => {
  const inputRef = useRef(null)
  const {
    archive, signs, selectedId, selectedIndex, selectedEntry, editedIds, message,
    select, step, revertSelected, close, loadProductionArchive, importFile
  } = archiveState

  const handleFileInput = async (event) => {
    await importFile(event.target.files?.[0])
    event.target.value = ''
  }

  const fileInput = (
    <input
      ref={inputRef}
      className="visually-hidden"
      type="file"
      accept="application/json,.json"
      onChange={handleFileInput}
      tabIndex={-1}
      aria-label="Choose a door sign JSON file"
    />
  )

  if (!archive) {
    return (
      <section className="archive-nav archive-nav--empty" aria-label="Saved signs">
        {fileInput}
        <div className="archive-nav__empty">
          <div className="archive-nav__empty-text">
            <span className="archive-nav__title">Saved signs</span>
            <span className="archive-nav__hint">Open an archive to switch between signs here.</span>
          </div>
          <div className="archive-nav__actions">
            <button type="button" className="archive-btn" onClick={loadProductionArchive}>
              Production archive
              <span className="archive-btn__count" aria-label={`${productionArchive.signs.length} signs`}>{productionArchive.signs.length}</span>
            </button>
            <button
              type="button"
              className="archive-btn archive-btn--secondary"
              onClick={() => inputRef.current?.click()}
            >
              Import JSON…
            </button>
          </div>
        </div>
        {message && <p className="archive-nav__message" role="status">{message}</p>}
      </section>
    )
  }

  const isEdited = selectedEntry && editedIds.has(selectedEntry.id)

  return (
    <section className="archive-nav" aria-label="Saved sign archive">
      {fileInput}
      <div className="archive-nav__meta">
        <div className="archive-nav__summary">
          <span className="archive-nav__title" title={archive.title}>{archive.title}</span>
          <span className="archive-nav__position">
            {selectedIndex >= 0 ? `${selectedIndex + 1} of ${signs.length}` : `${signs.length} signs`}
          </span>
          {isEdited && <span className="archive-edited-dot archive-nav__edited">Edited</span>}
        </div>
        <div className="archive-nav__links">
          {isEdited && (
            <button type="button" className="archive-nav__link" onClick={revertSelected}>Revert</button>
          )}
          <a className="archive-nav__link" href={browseHref} onClick={onBrowse}>Browse all</a>
          <button type="button" className="archive-nav__link" onClick={() => inputRef.current?.click()}>
            Import
          </button>
          <button type="button" className="archive-nav__link" onClick={close}>Close</button>
        </div>
      </div>
      <div className="archive-nav__row">
        <button
          type="button"
          className="archive-nav__step"
          onClick={() => step(-1)}
          disabled={selectedIndex <= 0}
          aria-label="Previous sign"
          title="Previous sign"
        >
          <Chevron direction="left" />
        </button>
        <SignCombobox
          id="archiveNavigatorSearch"
          ariaLabel={`Find a sign in ${archive.title}`}
          entries={signs}
          selectedId={selectedId}
          editedIds={editedIds}
          onSelect={select}
          placeholder="Search saved signs…"
        />
        <button
          type="button"
          className="archive-nav__step"
          onClick={() => step(1)}
          disabled={selectedIndex < 0 || selectedIndex >= signs.length - 1}
          aria-label="Next sign"
          title="Next sign"
        >
          <Chevron direction="right" />
        </button>
      </div>
    </section>
  )
}
