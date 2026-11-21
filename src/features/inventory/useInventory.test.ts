import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Supply } from '../../types'
import { SUPPLIES_STORAGE_KEY } from '../../storage/localStorage'
import { useInventory } from './useInventory'

function storedSupplies(): Supply[] {
  return JSON.parse(
    window.localStorage.getItem(SUPPLIES_STORAGE_KEY) ?? '[]',
  ) as Supply[]
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('useInventory', () => {
  it('creates, updates and removes supplies, persisting each change', () => {
    const { result } = renderHook(() => useInventory())

    act(() => {
      expect(
        result.current.addSupply({
          name: 'Harina 000',
          quantity: 2,
          unit: 'kg',
          unitCost: 1.5,
          minStock: 0,
          packageSize: 1,
          packageCost: 1.5,
        }),
      ).toBe(true)
    })

    expect(result.current.supplies).toHaveLength(1)
    expect(storedSupplies()).toHaveLength(1)

    const id = result.current.supplies[0].id

    act(() => {
      result.current.updateSupply(id, {
        name: 'Harina 0000',
        quantity: 5,
        unit: 'kg',
        unitCost: 2,
        minStock: 0,
        packageSize: 1,
        packageCost: 2,
      })
    })

    expect(result.current.supplies[0]).toMatchObject({
      name: 'Harina 0000',
      quantity: 5,
      unitCost: 2,
        minStock: 0,
        packageSize: 1,
        packageCost: 2,
    })
    expect(storedSupplies()[0].name).toBe('Harina 0000')

    act(() => {
      result.current.removeSupply(id)
    })

    expect(result.current.supplies).toEqual([])
    expect(storedSupplies()).toEqual([])
  })

  it('adjusts stock up and down, persisting the result', () => {
    const { result } = renderHook(() => useInventory())

    act(() => {
      result.current.addSupply({
        name: 'Harina 000',
        quantity: 2,
        unit: 'kg',
        unitCost: 1.5,
          minStock: 0,
          packageSize: 1,
          packageCost: 1.5,
      })
    })

    const id = result.current.supplies[0].id

    act(() => {
      expect(
        result.current.adjustStock([{ supplyId: id, delta: -0.5 }]),
      ).toBe(true)
    })

    expect(result.current.supplies[0].quantity).toBe(1.5)
    expect(storedSupplies()[0].quantity).toBe(1.5)

    act(() => {
      result.current.adjustStock([{ supplyId: id, delta: 0.25 }])
    })

    expect(result.current.supplies[0].quantity).toBe(1.75)
  })

  it('starts empty and exposes an error when stored data is corrupt', () => {
    window.localStorage.setItem(SUPPLIES_STORAGE_KEY, 'broken')

    const { result } = renderHook(() => useInventory())

    expect(result.current.supplies).toEqual([])
    expect(result.current.error).toContain('dañados')

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })
})
