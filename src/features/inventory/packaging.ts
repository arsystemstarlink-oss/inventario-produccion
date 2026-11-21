import type { Supply } from '../../types'
import { formatAmount } from '../../lib/format'
import {
  convert,
  displayCostUnit,
  UNIT_LABELS,
} from '../../lib/units'

export function packageCount(supply: Supply): number {
  if (!(supply.packageSize > 0)) return 0
  return supply.quantity / supply.packageSize
}

export function minPackageCount(supply: Supply): number {
  if (!(supply.packageSize > 0)) return 0
  return supply.minStock / supply.packageSize
}

export function packagesToBuy(supply: Supply): number {
  if (!(supply.packageSize > 0)) return 0
  const needed = Math.max(0, supply.minStock - supply.quantity)
  if (needed <= 0) return 0
  return Math.ceil(needed / supply.packageSize - 1e-9)
}

export function estimatedPurchaseCost(supply: Supply): number {
  return packagesToBuy(supply) * supply.packageCost
}

export function costPerDisplayUnit(supply: Supply): number {
  const displayUnit = displayCostUnit(supply.unit)
  const factor = convert(1, displayUnit, supply.unit)
  if (factor === null) return supply.unitCost
  return supply.unitCost * factor
}

export function displayUnitLabel(supply: Supply): string {
  return UNIT_LABELS[displayCostUnit(supply.unit)]
}

export function formatPackageCount(count: number): string {
  return `${formatAmount(count)} ${count === 1 ? 'paquete' : 'paquetes'}`
}
