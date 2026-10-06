import { useCallback, useEffect, useMemo, useState } from 'react'
import { cardHolders as builtInHolders } from '../data/cardHolders'
import {
  CUSTOM_HOLDERS_KEY,
  readCustomHolders,
  toCardHolder,
  toCustomRecord,
  writeCustomHolders
} from '../sign/customHolders'

// The built-in holder presets plus the custom ones saved in this browser. A custom holder never
// shadows a built-in one of the same name.
export const useCardHolders = () => {
  const [customRecords, setCustomRecords] = useState(readCustomHolders)

  // Another tab saved or deleted a holder.
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === CUSTOM_HOLDERS_KEY) setCustomRecords(readCustomHolders())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const cardHolders = useMemo(() => ({
    ...builtInHolders,
    ...Object.fromEntries(Object.entries(customRecords)
      .filter(([name]) => !builtInHolders[name])
      .map(([name, record]) => [name, toCardHolder(record)]))
  }), [customRecords])

  const update = useCallback((change) => {
    setCustomRecords(prev => {
      const next = change(prev)
      writeCustomHolders(next)
      return next
    })
  }, [])

  // Saves `holder` under `name`; `previousName` renames an existing custom holder.
  const saveCustomHolder = useCallback((name, holder, previousName = null) => {
    update(prev => {
      const next = { ...prev }
      if (previousName && previousName !== name) delete next[previousName]
      next[name.trim()] = toCustomRecord(holder)
      return next
    })
  }, [update])

  const deleteCustomHolder = useCallback((name) => {
    update(prev => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [update])

  return {
    cardHolders,
    builtInHolderNames: Object.keys(builtInHolders),
    saveCustomHolder,
    deleteCustomHolder
  }
}
