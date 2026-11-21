import type { ProductionFormValues } from '../../types'
import { parseDecimal } from '../../lib/number'

export type ProductionFieldErrors = Partial<
  Record<keyof ProductionFormValues, string>
>

export function hasErrors(errors: ProductionFieldErrors): boolean {
  return Object.keys(errors).length > 0
}

export function validateProduction(
  input: ProductionFormValues,
): ProductionFieldErrors {
  const errors: ProductionFieldErrors = {}

  if (input.recipeId === '') {
    errors.recipeId = 'Selecciona una receta.'
  }

  const quantity = parseDecimal(input.quantity)
  if (input.quantity.trim() === '') {
    errors.quantity = 'La cantidad es obligatoria.'
  } else if (quantity === null) {
    errors.quantity = 'La cantidad debe ser un número.'
  } else if (quantity <= 0) {
    errors.quantity = 'La cantidad debe ser mayor que cero.'
  }

  return errors
}

export function toProducedQuantity(input: ProductionFormValues): number {
  return parseDecimal(input.quantity) ?? 0
}
