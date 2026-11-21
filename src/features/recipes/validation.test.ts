import { describe, expect, it } from 'vitest'
import type { Recipe, Supply } from '../../types'
import { hasErrors, toRecipeDraft, validateRecipe } from './validation'

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
    id: 'agua',
    name: 'Agua',
    quantity: 10,
    unit: 'l',
    unitCost: 0,
    minStock: 0,
    packageSize: 1,
    packageCost: 0,
  },
]

const existing: Recipe[] = [
  {
    id: 'pan',
    name: 'Pan',
    outputQuantity: 20,
    ingredients: [{ supplyId: 'harina', quantity: 1 }],
  },
]

const validInput = {
  name: 'Facturas',
  outputQuantity: '12',
  ingredients: [{ supplyId: 'harina', quantity: '0.5', unit: 'kg' as const }],
}

describe('validateRecipe', () => {
  it('accepts a valid recipe', () => {
    expect(validateRecipe(validInput, existing, supplies)).toEqual({})
  })

  it('requires a unique name', () => {
    expect(
      validateRecipe({ ...validInput, name: ' ' }, existing, supplies).name,
    ).toBe('El nombre es obligatorio.')
    expect(
      validateRecipe({ ...validInput, name: ' pan ' }, existing, supplies).name,
    ).toBe('Ya existe una receta con ese nombre.')
    expect(
      validateRecipe({ ...validInput, name: 'Pan' }, existing, supplies, 'pan')
        .name,
    ).toBeUndefined()
  })

  it('requires a positive output quantity', () => {
    expect(
      validateRecipe(
        { ...validInput, outputQuantity: '' },
        existing,
        supplies,
      ).outputQuantity,
    ).toBe('El rendimiento es obligatorio.')
    expect(
      validateRecipe(
        { ...validInput, outputQuantity: '0' },
        existing,
        supplies,
      ).outputQuantity,
    ).toBe('El rendimiento debe ser mayor que cero.')
    expect(
      validateRecipe(
        { ...validInput, outputQuantity: 'abc' },
        existing,
        supplies,
      ).outputQuantity,
    ).toBe('El rendimiento debe ser un número.')
  })

  it('requires at least one ingredient', () => {
    const errors = validateRecipe(
      { ...validInput, ingredients: [] },
      existing,
      supplies,
    )
    expect(errors.ingredients).toBe('Agrega al menos un ingrediente.')
  })

  it('validates each ingredient row', () => {
    const errors = validateRecipe(
      {
        ...validInput,
        ingredients: [
          { supplyId: '', quantity: '', unit: 'kg' },
          { supplyId: 'harina', quantity: '0', unit: 'kg' },
          { supplyId: 'harina', quantity: '1', unit: 'kg' },
        ],
      },
      existing,
      supplies,
    )

    expect(errors.ingredients).toBe('Revisa los ingredientes de la receta.')
    expect(errors.ingredientRows?.[0]).toEqual({
      supplyId: 'Selecciona un insumo.',
      quantity: 'La cantidad es obligatoria.',
    })
    expect(errors.ingredientRows?.[1]?.quantity).toBe(
      'La cantidad debe ser mayor que cero.',
    )
    expect(errors.ingredientRows?.[2]?.supplyId).toBe(
      'Este insumo ya está en la receta.',
    )
  })

  it('rejects ingredients that no longer exist in the inventory', () => {
    const errors = validateRecipe(
      {
        ...validInput,
        ingredients: [{ supplyId: 'deleted', quantity: '1', unit: 'kg' }],
      },
      existing,
      supplies,
    )

    expect(errors.ingredientRows?.[0]?.supplyId).toBe('El insumo ya no existe.')
  })

  it('rejects units that are incompatible with the supply', () => {
    const errors = validateRecipe(
      {
        ...validInput,
        ingredients: [{ supplyId: 'harina', quantity: '1', unit: 'l' }],
      },
      existing,
      supplies,
    )

    expect(errors.ingredientRows?.[0]?.unit).toBe(
      'La unidad no es compatible con la del insumo.',
    )
  })

  it('allows a compatible unit different from the supply unit', () => {
    const errors = validateRecipe(
      {
        ...validInput,
        ingredients: [{ supplyId: 'harina', quantity: '500', unit: 'g' }],
      },
      existing,
      supplies,
    )
    expect(errors).toEqual({})
  })

  it('reports whether there are errors', () => {
    expect(hasErrors(validateRecipe(validInput, existing, supplies))).toBe(false)
    expect(
      hasErrors(
        validateRecipe({ ...validInput, name: '' }, existing, supplies),
      ),
    ).toBe(true)
  })
})

describe('toRecipeDraft', () => {
  it('trims the name and parses numbers', () => {
    expect(
      toRecipeDraft({
        name: ' Facturas ',
        outputQuantity: '12',
        ingredients: [{ supplyId: 'harina', quantity: '0,5', unit: 'g' }],
      }),
    ).toEqual({
      name: 'Facturas',
      outputQuantity: 12,
      ingredients: [{ supplyId: 'harina', quantity: 0.5, unit: 'g' }],
    })
  })
})
