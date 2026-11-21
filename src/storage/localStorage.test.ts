import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductionRecord, Recipe, Supply } from '../types'
import {
  LEGACY_PRODUCTS_STORAGE_KEY,
  PRODUCTION_STORAGE_KEY,
  RECIPES_STORAGE_KEY,
  SUPPLIES_STORAGE_KEY,
  loadProduction,
  loadRecipes,
  loadSupplies,
  saveProduction,
  saveRecipes,
  saveSupplies,
} from './localStorage'

beforeEach(() => {
  window.localStorage.clear()
})

describe('supplies storage', () => {
  it('returns an empty list with no error when nothing is stored', () => {
    expect(loadSupplies()).toEqual({ data: [], error: null })
  })

  it('saves and loads supplies', () => {
    const supplies: Supply[] = [
      {
        id: 'harina',
        name: 'Harina 000',
        quantity: 2,
        unit: 'kg',
        unitCost: 1.5,
        minStock: 1,
        packageSize: 1,
        packageCost: 1.5,
      },
    ]

    expect(saveSupplies(supplies)).toEqual({ ok: true })
    expect(loadSupplies()).toEqual({ data: supplies, error: null })
    expect(
      JSON.parse(window.localStorage.getItem(SUPPLIES_STORAGE_KEY) ?? 'null'),
    ).toEqual(supplies)
  })

  it('migrates legacy products into supplies', () => {
    window.localStorage.setItem(
      LEGACY_PRODUCTS_STORAGE_KEY,
      JSON.stringify([{ id: 'a', name: 'Harina', quantity: 2, value: 1.5 }]),
    )

    expect(loadSupplies()).toEqual({
      data: [
        {
          id: 'a',
          name: 'Harina',
          quantity: 2,
          unit: 'unidad',
          unitCost: 1.5,
          minStock: 0,
          packageSize: 1,
          packageCost: 1.5,
        },
      ],
      error: null,
    })
  })

  it('defaults a missing minimum stock to zero', () => {
    window.localStorage.setItem(
      SUPPLIES_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'harina',
          name: 'Harina 000',
          quantity: 2,
          unit: 'kg',
          unitCost: 1.5,
        },
      ]),
    )

    expect(loadSupplies()).toEqual({
      data: [
        {
          id: 'harina',
          name: 'Harina 000',
          quantity: 2,
          unit: 'kg',
          unitCost: 1.5,
          minStock: 0,
          packageSize: 1,
          packageCost: 1.5,
        },
      ],
      error: null,
    })
  })

  it('ignores corrupt JSON and keeps a backup copy', () => {
    window.localStorage.setItem(SUPPLIES_STORAGE_KEY, '{not-json')

    const result = loadSupplies()

    expect(result.data).toEqual([])
    expect(result.error).toContain('dañados')
    expect(window.localStorage.getItem(`${SUPPLIES_STORAGE_KEY}:corrupt`)).toBe(
      '{not-json',
    )
  })

  it('ignores stored items with an invalid shape', () => {
    window.localStorage.setItem(
      SUPPLIES_STORAGE_KEY,
      JSON.stringify([
        { id: 'a', name: 'Harina', quantity: '2', unit: 'kg', unitCost: 1 },
      ]),
    )

    const result = loadSupplies()

    expect(result.data).toEqual([])
    expect(result.error).toContain('dañados')
  })

  it('reports an error when the quota is exceeded', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    const result = saveSupplies([])

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('No se pudieron guardar')
    }
  })
})

describe('recipes storage', () => {
  it('saves and loads recipes', () => {
    const recipes: Recipe[] = [
      {
        id: 'pan',
        name: 'Pan',
        outputQuantity: 20,
        ingredients: [{ supplyId: 'harina', quantity: 500, unit: 'g' }],
      },
    ]

    expect(saveRecipes(recipes)).toEqual({ ok: true })
    expect(loadRecipes()).toEqual({ data: recipes, error: null })
    expect(
      JSON.parse(window.localStorage.getItem(RECIPES_STORAGE_KEY) ?? 'null'),
    ).toEqual(recipes)
  })

  it('loads recipes saved without an explicit ingredient unit', () => {
    const recipes = [
      {
        id: 'pan',
        name: 'Pan',
        outputQuantity: 20,
        ingredients: [{ supplyId: 'harina', quantity: 1 }],
      },
    ]
    window.localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes))

    expect(loadRecipes()).toEqual({ data: recipes, error: null })
  })

  it('rejects recipes without ingredients', () => {
    window.localStorage.setItem(
      RECIPES_STORAGE_KEY,
      JSON.stringify([
        { id: 'pan', name: 'Pan', outputQuantity: 20, ingredients: [] },
      ]),
    )

    const result = loadRecipes()

    expect(result.data).toEqual([])
    expect(result.error).toContain('dañados')
  })
})

describe('production storage', () => {
  it('saves and loads production records', () => {
    const records: ProductionRecord[] = [
      {
        id: 'p1',
        recipeId: 'pan',
        recipeName: 'Pan',
        quantity: 20,
        producedAt: '2026-01-01T10:00:00.000Z',
        consumed: [
          {
            supplyId: 'harina',
            supplyName: 'Harina 000',
            quantity: 1,
            unit: 'kg',
            unitCost: 2,
          },
        ],
      },
    ]

    expect(saveProduction(records)).toEqual({ ok: true })
    expect(loadProduction()).toEqual({ data: records, error: null })
    expect(
      JSON.parse(window.localStorage.getItem(PRODUCTION_STORAGE_KEY) ?? 'null'),
    ).toEqual(records)
  })

  it('rejects records without consumed ingredients', () => {
    window.localStorage.setItem(
      PRODUCTION_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'p1',
          recipeId: 'pan',
          recipeName: 'Pan',
          quantity: 20,
          producedAt: '2026-01-01T10:00:00.000Z',
          consumed: [],
        },
      ]),
    )

    const result = loadProduction()

    expect(result.data).toEqual([])
    expect(result.error).toContain('dañados')
  })
})
