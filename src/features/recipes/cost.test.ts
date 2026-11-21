import { describe, expect, it } from 'vitest'
import type { Recipe, Supply } from '../../types'
import { recipeBatchCost, recipeUnitCost } from './cost'

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
    quantity: 1,
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

describe('recipe costs', () => {
  it('calculates the batch and unit cost from the inventory', () => {
    expect(recipeBatchCost(recipe, supplies)).toBeCloseTo(2.2)
    expect(recipeUnitCost(recipe, supplies)).toBeCloseTo(0.11)
  })

  it('converts recipe units to the supply unit', () => {
    const gramsRecipe: Recipe = {
      ...recipe,
      ingredients: [{ supplyId: 'harina', quantity: 500, unit: 'g' }],
    }
    expect(recipeBatchCost(gramsRecipe, supplies)).toBeCloseTo(1)
  })

  it('returns null when a supply is missing', () => {
    const partial = supplies.filter((supply) => supply.id !== 'sal')
    expect(recipeBatchCost(recipe, partial)).toBeNull()
    expect(recipeUnitCost(recipe, partial)).toBeNull()
  })

  it('returns null when units are incompatible', () => {
    const invalid: Recipe = {
      ...recipe,
      ingredients: [{ supplyId: 'harina', quantity: 1, unit: 'l' }],
    }
    expect(recipeBatchCost(invalid, supplies)).toBeNull()
  })
})
