import { useRef, useState } from 'react'
import type { ProductionDraft, ProductionRecord } from '../../types'
import { loadProduction, saveProduction } from '../../storage/localStorage'
import { createId } from '../../lib/id'

export function useProduction() {
  const [initial] = useState(loadProduction)
  const [records, setRecords] = useState<ProductionRecord[]>(initial.data)
  const [error, setError] = useState<string | null>(initial.error)
  const recordsRef = useRef<ProductionRecord[]>(initial.data)

  const commit = (next: ProductionRecord[]): boolean => {
    const result = saveProduction(next)
    if (!result.ok) {
      setError(result.error)
      return false
    }
    recordsRef.current = next
    setRecords(next)
    setError(null)
    return true
  }

  const update = (
    build: (current: ProductionRecord[]) => ProductionRecord[],
  ): boolean => commit(build(recordsRef.current))
  const addRecord = (draft: ProductionDraft): boolean =>
    update((current) => [{ id: createId(), ...draft }, ...current])

  const restoreRecord = (record: ProductionRecord): boolean =>
    update((current) =>
      current.some((item) => item.id === record.id)
        ? current
        : [record, ...current],
    )

  const removeRecord = (id: string): boolean =>
    update((current) => current.filter((record) => record.id !== id))

  return {
    records,
    addRecord,
    restoreRecord,
    removeRecord,
    error,
    clearError: () => setError(null),
  }
}
