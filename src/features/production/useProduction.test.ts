import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ProductionRecord } from '../../types'
import { PRODUCTION_STORAGE_KEY } from '../../storage/localStorage'
import { useProduction } from './useProduction'

const draft = {
  recipeId: 'pan',
  recipeName: 'Pan',
  quantity: 20,
  producedAt: '2026-01-01T10:00:00.000Z',
  consumed: [
    {
      supplyId: 'harina',
      supplyName: 'Harina 000',
      quantity: 1,
      unit: 'kg' as const,
      unitCost: 2,
    },
  ],
}

function storedRecords(): ProductionRecord[] {
  return JSON.parse(
    window.localStorage.getItem(PRODUCTION_STORAGE_KEY) ?? '[]',
  ) as ProductionRecord[]
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('useProduction', () => {
  it('adds and removes records, persisting each change', () => {
    const { result } = renderHook(() => useProduction())

    act(() => {
      expect(result.current.addRecord(draft)).toBe(true)
    })

    expect(result.current.records).toHaveLength(1)
    expect(result.current.records[0]).toMatchObject({ recipeName: 'Pan' })
    expect(storedRecords()).toHaveLength(1)

    const id = result.current.records[0].id

    act(() => {
      result.current.removeRecord(id)
    })

    expect(result.current.records).toEqual([])
    expect(storedRecords()).toEqual([])
  })

  it('exposes an error when stored data is corrupt', () => {
    window.localStorage.setItem(PRODUCTION_STORAGE_KEY, 'broken')

    const { result } = renderHook(() => useProduction())

    expect(result.current.records).toEqual([])
    expect(result.current.error).toContain('dañados')
  })
})
