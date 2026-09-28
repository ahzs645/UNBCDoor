import React from 'react'
import { SignCombobox } from './SignCombobox'

const Chevron = ({ direction }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
  </svg>
)

// Shown at the top of the editor while an archive is loaded: jump to any sign by searching, or
// step through them in order. Edits stay attached to each entry, so going back and forth is safe.
export const ArchiveNavigator = ({ archiveState, browseHref, onBrowse }) => {
  const {
    archive, signs, selectedId, selectedIndex, selectedEntry, editedIds, select, step, revertSelected, close
  } = archiveState

  if (!archive) return null

  const isEdited = selectedEntry && editedIds.has(selectedEntry.id)

  return (
    <section className="archive-nav" aria-label="Saved sign archive">
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
