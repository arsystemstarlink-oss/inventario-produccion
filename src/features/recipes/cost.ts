import type { Recipe, RecipeIngredient, Supply } from '../../types'
import { convert } from '../../lib/units'

export function ingredientInSupplyUnit(
  ingredient: RecipeIngredient,
  supply: Supply,
): number | null {
  return convert(ingredient.quantity, ingredient.unit ?? supply.unit, supply.unit)
}

export function recipeBatchCost(
  recipe: Recipe,
  supplies: Supply[],
): number | null {
  let total = 0
  for (const ingredient of recipe.ingredients) {
    const supply = supplies.find((item) => item.id === ingredient.supplyId)
    if (!supply) return null
    const quantity = ingredientInSupplyUnit(ingredient, supply)
    if (quantity === null) return null
    total += quantity * supply.unitCost
  }
  return total
}

export function recipeUnitCost(
  recipe: Recipe,
  supplies: Supply[],
): number | null {
  const batchCost = recipeBatchCost(recipe, supplies)
  if (batchCost === null || recipe.outputQuantity <= 0) return null
  return batchCost / recipe.outputQuantity
}
