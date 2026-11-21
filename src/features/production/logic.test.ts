import { describe, expect, it } from 'vitest'
import type { Recipe, Supply } from '../../types'
import {
  calculateRequirements,
  hasProblems,
  hasShortage,
  productionCapacity,
  requirementsCost,
  toConsumedIngredients,
} from './logic'

const supplies: Supply[] = [
  {
    id: 'harina',
    name: 'Harina 000',
    quantity: 5,
    unit: 'kg',
    unitCost: 2,
    minStock: 0,
    packageSize: 1,
    packageCost: 2,
  },
  {
    id: 'sal',
    name: 'Sal',
    quantity: 0.5,
    unit: 'kg',
    unitCost: 10,
    minStock: 0,
    packageSize: 1,
    packageCost: 10,
  },
]

const recipe: Recipe = {
  id: 'pan',
  name: 'Pan',
  outputQuantity: 20,
  ingredients: [
    { supplyId: 'harina', quantity: 1, unit: 'kg' },
    { supplyId: 'sal', quantity: 0.02, unit: 'kg' },
  ],
}

describe('calculateRequirements', () => {
  it('scales ingredients by the produced quantity', () => {
    const requirements = calculateRequirements(recipe, 40, supplies)

    expect(requirements).toEqual([
      {
        supplyId: 'harina',
        recipeQuantity: 2,
        recipeUnit: 'kg',
        quantity: 2,
        supply: supplies[0],
        available: 5,
        shortage: 0,
        problem: null,
      },
      {
        supplyId: 'sal',
        recipeQuantity: 0.04,
        recipeUnit: 'kg',
        quantity: 0.04,
        supply: supplies[1],
        available: 0.5,
        shortage: 0,
        problem: null,
      },
    ])
    expect(hasShortage(requirements)).toBe(false)
    expect(hasProblems(requirements)).toBe(false)
  })

  it('converts recipe units to the supply unit', () => {
    const gramsRecipe: Recipe = {
      ...recipe,
      ingredients: [{ supplyId: 'harina', quantity: 500, unit: 'g' }],
    }

    const requirements = calculateRequirements(gramsRecipe, 20, supplies)

    expect(requirements[0]).toMatchObject({
      recipeQuantity: 500,
      recipeUnit: 'g',
      quantity: 0.5,
      problem: null,
    })
  })

  it('detects shortages against the current stock', () => {
    const requirements = calculateRequirements(recipe, 200, supplies)

    expect(requirements[0].shortage).toBe(5)
    expect(requirements[1].shortage).toBe(0)
    expect(hasShortage(requirements)).toBe(true)
  })

  it('marks missing supplies as a problem', () => {
    const requirements = calculateRequirements(recipe, 20, [])
    expect(requirements[0].supply).toBeNull()
    expect(requirements[0].problem).toBe('missing')
    expect(requirements[0].shortage).toBe(1)
    expect(hasProblems(requirements)).toBe(true)
    expect(toConsumedIngredients(requirements)).toBeNull()
  })

  it('marks incompatible units as a problem', () => {
    const invalid: Recipe = {
      ...recipe,
      ingredients: [{ supplyId: 'harina', quantity: 1, unit: 'l' }],
    }
    const requirements = calculateRequirements(invalid, 20, supplies)

    expect(requirements[0].problem).toBe('incompatible')
    expect(requirements[0].shortage).toBe(0)
    expect(hasProblems(requirements)).toBe(true)
  })

  it('returns no requirements for invalid quantities', () => {
    expect(calculateRequirements(recipe, 0, supplies)).toEqual([])
    expect(calculateRequirements(recipe, -5, supplies)).toEqual([])
  })
})

describe('requirementsCost', () => {
  it('calculates the estimated material cost', () => {
    const requirements = calculateRequirements(recipe, 40, supplies)
    expect(requirementsCost(requirements)).toBeCloseTo(4.4)
  })

  it('returns null when a supply is missing or incompatible', () => {
    expect(requirementsCost(calculateRequirements(recipe, 20, []))).toBeNull()
  })
})

describe('toConsumedIngredients', () => {
  it('takes a snapshot of names, units and costs converted to the supply unit', () => {
    const gramsRecipe: Recipe = {
      ...recipe,
      ingredients: [
        { supplyId: 'harina', quantity: 500, unit: 'g' },
        { supplyId: 'sal', quantity: 0.02, unit: 'kg' },
      ],
    }
    const requirements = calculateRequirements(gramsRecipe, 40, supplies)

    expect(toConsumedIngredients(requirements)).toEqual([
      {
        supplyId: 'harina',
        supplyName: 'Harina 000',
        quantity: 1,
        unit: 'kg',
        unitCost: 2,
      },
      {
        supplyId: 'sal',
        supplyName: 'Sal',
        quantity: 0.04,
        unit: 'kg',
        unitCost: 10,
      },
    ])
  })
})

describe('productionCapacity', () => {
  it('finds the maximum producible quantity and limiting supply', () => {
    expect(productionCapacity(recipe, supplies)).toEqual({
      maxUnits: 100,
      limitingSupply: supplies[0],
    })
  })

  it('accounts for unit conversions', () => {
    const gramsRecipe: Recipe = {
      ...recipe,
      ingredients: [{ supplyId: 'harina', quantity: 500, unit: 'g' }],
    }
    expect(productionCapacity(gramsRecipe, supplies)).toEqual({
      maxUnits: 200,
      limitingSupply: supplies[0],
    })
  })

  it('returns zero when there is no stock', () => {
    const empty = supplies.map((supply) => ({ ...supply, quantity: 0 }))
    expect(productionCapacity(recipe, empty)).toEqual({
      maxUnits: 0,
      limitingSupply: empty[0],
    })
  })

  it('returns null when a supply is missing', () => {
    expect(productionCapacity(recipe, [])).toBeNull()
  })
})
