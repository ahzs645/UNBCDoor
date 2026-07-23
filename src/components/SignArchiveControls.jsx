import React, { useEffect, useRef, useState } from 'react'
import { CustomSelect } from './CustomSelect'
import { createSignArchive, parseSignArchive } from '../sign/signArchive'
import productionArchive from '../../data/door-sign-archive.json'

const downloadJson = (archive, filename) => {
  const blob = new Blob([`${JSON.stringify(archive, null, 2)}\n`], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export const SignArchiveControls = ({ signData, onLoadSign, onEditSign }) => {
  const inputRef = useRef(null)
  const [archive, setArchive] = useState(null)
  const [selectedId, setSelectedId] = useState('')
  const [message, setMessage] = useState('')

  // Keep edits attached to the selected archive entry. Without this, switching away and
  // back reloads the original imported data and loses preferences such as the alumni badge.
  useEffect(() => {
    if (!selectedId) return

    setArchive(currentArchive => {
      if (!currentArchive) return currentArchive

      return {
        ...currentArchive,
        signs: currentArchive.signs.map(entry => (
          entry.id === selectedId ? { ...entry, signData } : entry
        ))
      }
    })
  }, [selectedId, signData])

  const loadEntry = (entry, importedArchive = archive) => {
    setSelectedId(entry.id)
    onLoadSign(entry.signData)
    setMessage(`Loaded “${entry.label}” from ${importedArchive?.title || 'the archive'}.`)
  }

  const applyArchive = (importedArchive, successMessage) => {
    setArchive(importedArchive)
    loadEntry(importedArchive.signs[0], importedArchive)
    setMessage(successMessage)
  }

  const handleLoadProductionArchive = () => {
    const importedArchive = parseSignArchive(JSON.stringify(productionArchive))
    applyArchive(importedArchive, `Loaded the included production archive (${importedArchive.signs.length} signs).`)
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const importedArchive = parseSignArchive(await file.text())
      applyArchive(
        importedArchive,
        `Imported ${importedArchive.signs.length} sign${importedArchive.signs.length === 1 ? '' : 's'} from ${file.name}.`
      )
    } catch (error) {
      setArchive(null)
      setSelectedId('')
      setMessage(error.message)
    } finally {
      event.target.value = ''
    }
  }

  const handleSelection = (id) => {
    const entry = archive?.signs.find(sign => sign.id === id)
    if (entry) loadEntry(entry)
  }

  const handleExportCurrent = () => {
    const label = signData.name || signData.roomName || 'UNBC Door Sign'
    const archiveToSave = createSignArchive([{ id: 'current-sign', label, signData }], {
      title: label
    })
    downloadJson(archiveToSave, 'unbc-door-sign.json')
    setMessage('Exported the current sign as JSON.')
  }

  return (
    <section className="sign-archive-controls" aria-labelledby="sign-archive-title">
      <div className="sign-archive-controls__heading">
        <div>
          <h2 id="sign-archive-title">Saved signs</h2>
          <p>Import one sign or a whole sign archive, then choose an entry to edit.</p>
        </div>
        <div className="sign-archive-controls__actions">
          <button type="button" onClick={handleLoadProductionArchive} className="archive-btn">
            Load production archive
          </button>
          <button type="button" onClick={() => inputRef.current?.click()} className="archive-btn">
            Import JSON
          </button>
          <button type="button" onClick={handleExportCurrent} className="archive-btn archive-btn--secondary">
            Export current
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="application/json,.json"
        onChange={handleImport}
        aria-label="Choose a door sign JSON archive"
      />

      {archive?.signs.length > 0 && (
        <>
          <div className="sign-archive-controls__picker">
            <label htmlFor="savedSign">Imported sign ({archive.signs.length})</label>
            <CustomSelect
              id="savedSign"
              name="savedSign"
              value={selectedId}
              options={archive.signs.map(sign => ({ value: sign.id, label: sign.label }))}
              onChange={handleSelection}
            />
          </div>
          {selectedId && onEditSign && (
            <a className="archive-btn sign-archive-controls__edit" href={import.meta.env.BASE_URL} onClick={onEditSign}>
              Open selected sign in editor
            </a>
          )}
        </>
      )}

      {message && <p className="sign-archive-controls__message" role="status">{message}</p>}
    </section>
  )
}
