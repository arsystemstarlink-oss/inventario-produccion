import type { Supply } from '../../types'

export function isLowStock(supply: Supply): boolean {
  return supply.minStock > 0 && supply.quantity < supply.minStock
}

export function lowStockSupplies(supplies: Supply[]): Supply[] {
  return supplies.filter(isLowStock)
}
