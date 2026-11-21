import { useRef, useState } from 'react'
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
  const suppliesRef = useRef<Supply[]>(initial.data)

  const commit = (next: Supply[]): boolean => {
    const result = saveSupplies(next)
    if (!result.ok) {
      setError(result.error)
      return false
    }
    suppliesRef.current = next
    setSupplies(next)
    setError(null)
    return true
  }

  const update = (build: (current: Supply[]) => Supply[]): boolean =>
    commit(build(suppliesRef.current))

  const addSupply = (draft: SupplyDraft): boolean =>
    update((current) => [...current, { id: createId(), ...draft }])

  const createSupply = (draft: SupplyDraft): Supply | null => {
    const supply: Supply = { id: createId(), ...draft }
    return update((current) => [...current, supply]) ? supply : null
  }

  const restoreSupply = (supply: Supply): boolean =>
    update((current) =>
      current.some((item) => item.id === supply.id)
        ? current
        : [...current, supply],
    )

  const updateSupply = (id: string, draft: SupplyDraft): boolean =>
    update((current) =>
      current.map((supply) =>
        supply.id === id ? { id, ...draft } : supply,
      ),
    )

  const removeSupply = (id: string): boolean =>
    update((current) => current.filter((supply) => supply.id !== id))

  const adjustStock = (changes: StockChange[]): boolean => {
    if (changes.length === 0) return true

    return update((current) =>
      current.map((supply) => {
        const delta = changes
          .filter((change) => change.supplyId === supply.id)
          .reduce((total, change) => total + change.delta, 0)
        if (delta === 0) return supply
        return {
          ...supply,
          quantity: roundQuantity(Math.max(0, supply.quantity + delta)),
        }
      }),
    )
  }

  return {
    supplies,
    addSupply,
    createSupply,
    restoreSupply,
    updateSupply,
    removeSupply,
    adjustStock,
    error,
    clearError: () => setError(null),
  }
}
