import { describe, expect, it } from 'vitest'
import {
  areUnitsCompatible,
  compatibleUnits,
  convert,
  formatQuantity,
  roundQuantity,
} from './units'

describe('unit conversion', () => {
  it('converts between mass units', () => {
    expect(convert(500, 'g', 'kg')).toBe(0.5)
    expect(convert(0.5, 'kg', 'g')).toBe(500)
  })

  it('converts between volume units', () => {
    expect(convert(1.5, 'l', 'ml')).toBe(1500)
    expect(convert(250, 'ml', 'l')).toBe(0.25)
  })

  it('keeps count units unchanged', () => {
    expect(convert(3, 'unidad', 'unidad')).toBe(3)
  })

  it('returns null for incompatible units', () => {
    expect(convert(1, 'kg', 'l')).toBeNull()
    expect(convert(1, 'g', 'unidad')).toBeNull()
  })

  it('exposes compatible units by family', () => {
    expect(areUnitsCompatible('kg', 'g')).toBe(true)
    expect(areUnitsCompatible('ml', 'l')).toBe(true)
    expect(areUnitsCompatible('kg', 'ml')).toBe(false)
    expect(compatibleUnits('kg')).toEqual(['kg', 'g'])
    expect(compatibleUnits('unidad')).toEqual(['unidad'])
  })
})

describe('quantity formatting', () => {
  it('formats amounts with their unit', () => {
    expect(formatQuantity(2, 'kg')).toBe('2 kg')
    expect(formatQuantity(1, 'unidad')).toBe('1 unidad')
    expect(formatQuantity(2, 'unidad')).toBe('2 unidades')
  })

  it('rounds to three decimals', () => {
    expect(roundQuantity(0.12345)).toBe(0.123)
  })
})
