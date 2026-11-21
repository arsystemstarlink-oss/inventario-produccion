import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Recipe } from '../../types'
import { RECIPES_STORAGE_KEY } from '../../storage/localStorage'
import { useRecipes } from './useRecipes'

function storedRecipes(): Recipe[] {
  return JSON.parse(
    window.localStorage.getItem(RECIPES_STORAGE_KEY) ?? '[]',
  ) as Recipe[]
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('useRecipes', () => {
  it('creates, updates and removes recipes, persisting each change', () => {
    const { result } = renderHook(() => useRecipes())

    act(() => {
      expect(
        result.current.addRecipe({
          name: 'Pan',
          outputQuantity: 20,
          ingredients: [{ supplyId: 'harina', quantity: 1, unit: 'kg' }],
        }),
      ).toBe(true)
    })

    expect(result.current.recipes).toHaveLength(1)
    expect(storedRecipes()).toHaveLength(1)

    const id = result.current.recipes[0].id

    act(() => {
      result.current.updateRecipe(id, {
        name: 'Pan integral',
        outputQuantity: 24,
        ingredients: [{ supplyId: 'harina-integral', quantity: 1.2, unit: 'kg' }],
      })
    })

    expect(result.current.recipes[0]).toMatchObject({
      name: 'Pan integral',
      outputQuantity: 24,
    })
    expect(storedRecipes()[0].name).toBe('Pan integral')

    act(() => {
      result.current.removeRecipe(id)
    })

    expect(result.current.recipes).toEqual([])
    expect(storedRecipes()).toEqual([])
  })

  it('exposes an error when stored data is corrupt', () => {
    window.localStorage.setItem(RECIPES_STORAGE_KEY, 'broken')

    const { result } = renderHook(() => useRecipes())

    expect(result.current.recipes).toEqual([])
    expect(result.current.error).toContain('dañados')
  })
})
