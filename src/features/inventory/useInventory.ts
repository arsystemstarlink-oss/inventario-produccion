import { useState } from 'react'
import type { Supply, SupplyDraft } from '../../types'
import { loadSupplies, saveSupplies } from '../../storage/localStorage'
import { createId } from '../../lib/id'
import { roundQuantity } from '../../lib/units'

export type StockChange = {
  supplyId: string
  delta: number
}

export function useInventory() {
  const [initial] = useState(loadSupplies)
  const [supplies, setSupplies] = useState<Supply[]>(initial.data)
  const [error, setError] = useState<string | null>(initial.error)

  const commit = (next: Supply[]): boolean => {
    const result = saveSupplies(next)
    if (!result.ok) {
      setError(result.error)
      return false
    }
    setSupplies(next)
    setError(null)
    return true
  }

  const addSupply = (draft: SupplyDraft): boolean =>
    commit([...supplies, { id: createId(), ...draft }])

  const updateSupply = (id: string, draft: SupplyDraft): boolean =>
    commit(
      supplies.map((supply) =>
        supply.id === id ? { id, ...draft } : supply,
      ),
    )

  const removeSupply = (id: string): boolean =>
    commit(supplies.filter((supply) => supply.id !== id))

  const adjustStock = (changes: StockChange[]): boolean => {
    if (changes.length === 0) return true

    const next = supplies.map((supply) => {
      const delta = changes
        .filter((change) => change.supplyId === supply.id)
        .reduce((total, change) => total + change.delta, 0)
      if (delta === 0) return supply
      return {
        ...supply,
        quantity: roundQuantity(Math.max(0, supply.quantity + delta)),
      }
    })

    return commit(next)
  }

  return {
    supplies,
    addSupply,
    updateSupply,
    removeSupply,
    adjustStock,
    error,
    clearError: () => setError(null),
  }
}
