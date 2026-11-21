import { describe, expect, it } from 'vitest'
import type { Supply } from '../../types'
import {
  costPerDisplayUnit,
  estimatedPurchaseCost,
  formatPackageCount,
  minPackageCount,
  packageCount,
  packagesToBuy,
} from './packaging'

const supply: Supply = {
  id: 'harina',
  name: 'Harina 000',
  quantity: 2000,
  unit: 'g',
  unitCost: 0.002,
  minStock: 5000,
  packageSize: 500,
  packageCost: 1,
}

describe('packaging helpers', () => {
  it('calculates packages from content quantity', () => {
    expect(packageCount(supply)).toBe(4)
    expect(minPackageCount(supply)).toBe(10)
    expect(formatPackageCount(4)).toBe('4 paquetes')
    expect(formatPackageCount(1)).toBe('1 paquete')
  })

  it('suggests whole packages to reach the minimum stock', () => {
    expect(packagesToBuy(supply)).toBe(6)
    expect(estimatedPurchaseCost(supply)).toBe(6)
  })

  it('does not suggest purchases above the minimum', () => {
    expect(
      packagesToBuy({ ...supply, quantity: 6000 }),
    ).toBe(0)
  })

  it('calculates the cost per readable unit', () => {
    expect(costPerDisplayUnit(supply)).toBeCloseTo(2)
    expect(
      costPerDisplayUnit({ ...supply, unit: 'unidad', unitCost: 0.5 }),
    ).toBe(0.5)
  })
})
