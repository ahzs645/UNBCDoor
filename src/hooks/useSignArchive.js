import { useCallback, useEffect, useMemo, useState } from 'react'
import { createSignArchive, parseSignArchive } from '../sign/signArchive'
import { signDataDiffers } from '../sign/signArchiveSearch'
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

const slugify = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'unbc-door-signs'

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

// The loaded archive lives above both pages so the saved-signs browser and the editor's
// navigator share one selection, and edits made in the editor stay attached to their entry.
export const useSignArchive = (signData, setSignData) => {
  const [archive, setArchive] = useState(null)
  const [originals, setOriginals] = useState({})
  const [selectedId, setSelectedId] = useState('')
  const [message, setMessage] = useState('')

  // Keep edits attached to the selected archive entry. Without this, switching away and back
  // reloads the original imported data and loses preferences such as the alumni badge.
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

  const signs = archive?.signs || []
  const selectedIndex = signs.findIndex(entry => entry.id === selectedId)
  const selectedEntry = selectedIndex >= 0 ? signs[selectedIndex] : null

  const editedIds = useMemo(() => new Set(
    signs
      .filter(entry => originals[entry.id] && signDataDiffers(entry.signData, originals[entry.id]))
      .map(entry => entry.id)
  ), [signs, originals])

  const loadEntry = useCallback((entry) => {
    if (!entry) return
    setSelectedId(entry.id)
    setSignData(entry.signData)
  }, [setSignData])

  const applyArchive = (importedArchive, successMessage) => {
    // loadedAt tells views a different archive arrived, even one with the same title.
    setArchive({ ...importedArchive, loadedAt: Date.now() })
    setOriginals(Object.fromEntries(importedArchive.signs.map(entry => [entry.id, entry.signData])))
    loadEntry(importedArchive.signs[0])
    setMessage(successMessage)
  }

  const loadProductionArchive = () => {
    const importedArchive = parseSignArchive(JSON.stringify(productionArchive))
    applyArchive(importedArchive, `Loaded the production archive (${plural(importedArchive.signs.length, 'sign')}).`)
  }

  const importFile = async (file) => {
    if (!file) return
    try {
      const importedArchive = parseSignArchive(await file.text())
      applyArchive(importedArchive, `Imported ${plural(importedArchive.signs.length, 'sign')} from ${file.name}.`)
    } catch (error) {
      setMessage(`Couldn’t import ${file.name}: ${error.message}`)
    }
  }

  const select = (id) => {
    loadEntry(signs.find(entry => entry.id === id))
  }

  const step = (delta) => {
    if (selectedIndex < 0) return
    loadEntry(signs[selectedIndex + delta])
  }

  const revertSelected = () => {
    if (!selectedEntry || !originals[selectedEntry.id]) return
    setSignData(originals[selectedEntry.id])
    setMessage(`Reverted “${selectedEntry.label}” to its saved version.`)
  }

  const close = () => {
    setArchive(null)
    setOriginals({})
    setSelectedId('')
    setMessage('Closed the archive. The sign in the editor was kept.')
  }

  const exportCurrent = () => {
    const label = selectedEntry?.label || signData.name || signData.roomName || 'UNBC Door Sign'
    const archiveToSave = createSignArchive([{ id: selectedEntry?.id || 'current-sign', label, signData }], {
      title: label
    })
    downloadJson(archiveToSave, `${slugify(label)}.json`)
    setMessage('Exported the current sign as JSON.')
  }

  const exportArchive = () => {
    if (!archive) return
    const archiveToSave = createSignArchive(archive.signs, { title: archive.title })
    downloadJson(archiveToSave, `${slugify(archive.title)}.json`)
    setMessage(`Exported ${plural(archive.signs.length, 'sign')}${editedIds.size ? `, including ${plural(editedIds.size, 'edited sign')}` : ''}.`)
  }

  return {
    archive,
    signs,
    selectedId,
    selectedIndex,
    selectedEntry,
    editedIds,
    message,
    loadProductionArchive,
    importFile,
    select,
    step,
    revertSelected,
    close,
    exportCurrent,
    exportArchive
  }
}
