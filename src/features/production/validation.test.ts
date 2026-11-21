import { describe, expect, it } from 'vitest'
import {
  hasErrors,
  toProducedQuantity,
  validateProduction,
} from './validation'

const validInput = { recipeId: 'pan', quantity: '40' }

describe('validateProduction', () => {
  it('accepts a valid production', () => {
    expect(validateProduction(validInput)).toEqual({})
  })

  it('requires a recipe', () => {
    expect(validateProduction({ ...validInput, recipeId: '' }).recipeId).toBe(
      'Selecciona una receta.',
    )
  })

  it('requires a positive quantity', () => {
    expect(validateProduction({ ...validInput, quantity: '' }).quantity).toBe(
      'La cantidad es obligatoria.',
    )
    expect(validateProduction({ ...validInput, quantity: '0' }).quantity).toBe(
      'La cantidad debe ser mayor que cero.',
    )
    expect(validateProduction({ ...validInput, quantity: '-2' }).quantity).toBe(
      'La cantidad debe ser mayor que cero.',
    )
    expect(
      validateProduction({ ...validInput, quantity: 'dos' }).quantity,
    ).toBe('La cantidad debe ser un número.')
  })

  it('reports whether there are errors', () => {
    expect(hasErrors(validateProduction(validInput))).toBe(false)
    expect(hasErrors(validateProduction({ ...validInput, recipeId: '' }))).toBe(
      true,
    )
  })
})

describe('toProducedQuantity', () => {
  it('parses the quantity using comma or dot', () => {
    expect(toProducedQuantity({ recipeId: 'pan', quantity: '2,5' })).toBe(2.5)
  })
})
