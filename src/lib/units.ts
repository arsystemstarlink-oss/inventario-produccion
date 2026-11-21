import type { Unit } from '../types'
import { formatAmount } from './format'

export const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: 'kg', label: 'Kilogramo (kg)' },
  { value: 'g', label: 'Gramo (g)' },
  { value: 'l', label: 'Litro (L)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'unidad', label: 'Unidad' },
]

export const UNIT_LABELS: Record<Unit, string> = {
  kg: 'kg',
  g: 'g',
  l: 'L',
  ml: 'ml',
  unidad: 'unidad',
}

export const UNITS: Unit[] = UNIT_OPTIONS.map((option) => option.value)

export type UnitFamily = 'mass' | 'volume' | 'count'

const FAMILY_BY_UNIT: Record<Unit, UnitFamily> = {
  kg: 'mass',
  g: 'mass',
  l: 'volume',
  ml: 'volume',
  unidad: 'count',
}

const BASE_FACTOR: Record<Unit, number> = {
  kg: 1000,
  g: 1,
  l: 1000,
  ml: 1,
  unidad: 1,
}

const FAMILY_UNITS: Record<UnitFamily, Unit[]> = {
  mass: ['kg', 'g'],
  volume: ['l', 'ml'],
  count: ['unidad'],
}

export function unitFamily(unit: Unit): UnitFamily {
  return FAMILY_BY_UNIT[unit]
}

export function areUnitsCompatible(from: Unit, to: Unit): boolean {
  return unitFamily(from) === unitFamily(to)
}

export function compatibleUnits(unit: Unit): Unit[] {
  return FAMILY_UNITS[unitFamily(unit)]
}

export function convert(
  value: number,
  from: Unit,
  to: Unit,
): number | null {
  if (!areUnitsCompatible(from, to)) return null
  return (value * BASE_FACTOR[from]) / BASE_FACTOR[to]
}

export function roundQuantity(value: number): number {
  return Math.round(value * 1000) / 1000
}

export function unitLabel(unit: Unit, quantity: number): string {
  if (unit !== 'unidad') return UNIT_LABELS[unit]
  return quantity === 1 ? 'unidad' : 'unidades'
}

export function readableQuantity(
  value: number,
  unit: Unit,
): { value: number; unit: Unit } {
  if (unit === 'g' && Math.abs(value) >= 1000) {
    return { value: value / 1000, unit: 'kg' }
  }
  if (unit === 'ml' && Math.abs(value) >= 1000) {
    return { value: value / 1000, unit: 'l' }
  }
  return { value, unit }
}

export function displayCostUnit(unit: Unit): Unit {
  if (unit === 'g') return 'kg'
  if (unit === 'ml') return 'l'
  return unit
}

export function formatQuantity(value: number, unit: Unit): string {
  const readable = readableQuantity(value, unit)
  return `${formatAmount(readable.value)} ${unitLabel(
    readable.unit,
    readable.value,
  )}`
}
