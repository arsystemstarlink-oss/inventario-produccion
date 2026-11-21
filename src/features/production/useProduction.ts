import { useState } from 'react'
import type { ProductionDraft, ProductionRecord } from '../../types'
import { loadProduction, saveProduction } from '../../storage/localStorage'
import { createId } from '../../lib/id'

export function useProduction() {
  const [initial] = useState(loadProduction)
  const [records, setRecords] = useState<ProductionRecord[]>(initial.data)
  const [error, setError] = useState<string | null>(initial.error)

  const commit = (next: ProductionRecord[]): boolean => {
    const result = saveProduction(next)
    if (!result.ok) {
      setError(result.error)
      return false
    }
    setRecords(next)
    setError(null)
    return true
  }

  const addRecord = (draft: ProductionDraft): boolean =>
    commit([{ id: createId(), ...draft }, ...records])

  const removeRecord = (id: string): boolean =>
    commit(records.filter((record) => record.id !== id))

  return {
    records,
    addRecord,
    removeRecord,
    error,
    clearError: () => setError(null),
  }
}
