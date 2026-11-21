import type {
  Recipe,
  RecipeDraft,
  RecipeFormValues,
  Supply,
} from '../../types'
import { parseDecimal } from '../../lib/number'
import { areUnitsCompatible, UNITS } from '../../lib/units'

export type IngredientRowErrors = {
  supplyId?: string
  quantity?: string
  unit?: string
}

export type RecipeFieldErrors = {
  name?: string
  outputQuantity?: string
  ingredients?: string
  ingredientRows?: Record<number, IngredientRowErrors>
}

export function hasErrors(errors: RecipeFieldErrors): boolean {
  return Object.keys(errors).length > 0
}

export function validateRecipe(
  input: RecipeFormValues,
  recipes: Recipe[],
  supplies: Supply[],
  editingId?: string,
): RecipeFieldErrors {
  const errors: RecipeFieldErrors = {}
  const name = input.name.trim()

  if (name === '') {
    errors.name = 'El nombre es obligatorio.'
  } else if (
    recipes.some(
      (recipe) =>
        recipe.id !== editingId &&
        recipe.name.trim().toLowerCase() === name.toLowerCase(),
    )
  ) {
    errors.name = 'Ya existe una receta con ese nombre.'
  }

  const outputQuantity = parseDecimal(input.outputQuantity)
  if (input.outputQuantity.trim() === '') {
    errors.outputQuantity = 'El rendimiento es obligatorio.'
  } else if (outputQuantity === null) {
    errors.outputQuantity = 'El rendimiento debe ser un número.'
  } else if (outputQuantity <= 0) {
    errors.outputQuantity = 'El rendimiento debe ser mayor que cero.'
  }

  if (input.ingredients.length === 0) {
    errors.ingredients = 'Agrega al menos un ingrediente.'
  } else {
    const ingredientRows: Record<number, IngredientRowErrors> = {}
    const seen = new Set<string>()

    input.ingredients.forEach((ingredient, index) => {
      const rowErrors: IngredientRowErrors = {}
      const supply = supplies.find((item) => item.id === ingredient.supplyId)

      if (ingredient.supplyId === '') {
        rowErrors.supplyId = 'Selecciona un insumo.'
      } else if (!supply) {
        rowErrors.supplyId = 'El insumo ya no existe.'
      } else if (seen.has(ingredient.supplyId)) {
        rowErrors.supplyId = 'Este insumo ya está en la receta.'
      } else {
        seen.add(ingredient.supplyId)
      }

      const quantity = parseDecimal(ingredient.quantity)
      if (ingredient.quantity.trim() === '') {
        rowErrors.quantity = 'La cantidad es obligatoria.'
      } else if (quantity === null) {
        rowErrors.quantity = 'La cantidad debe ser un número.'
      } else if (quantity <= 0) {
        rowErrors.quantity = 'La cantidad debe ser mayor que cero.'
      }

      if (!UNITS.includes(ingredient.unit)) {
        rowErrors.unit = 'Selecciona una unidad.'
      } else if (supply && !areUnitsCompatible(ingredient.unit, supply.unit)) {
        rowErrors.unit = 'La unidad no es compatible con la del insumo.'
      }

      if (Object.keys(rowErrors).length > 0) {
        ingredientRows[index] = rowErrors
      }
    })

    if (Object.keys(ingredientRows).length > 0) {
      errors.ingredients = 'Revisa los ingredientes de la receta.'
      errors.ingredientRows = ingredientRows
    }
  }

  return errors
}

export function toRecipeDraft(input: RecipeFormValues): RecipeDraft {
  return {
    name: input.name.trim(),
    outputQuantity: parseDecimal(input.outputQuantity) ?? 1,
    ingredients: input.ingredients.map((ingredient) => ({
      supplyId: ingredient.supplyId,
      quantity: parseDecimal(ingredient.quantity) ?? 0,
      unit: ingredient.unit,
    })),
  }
}
