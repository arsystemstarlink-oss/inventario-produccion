import type { ConsumedIngredient, Recipe, Supply, Unit } from '../../types'
import { convert, roundQuantity } from '../../lib/units'

export type RequirementProblem = 'missing' | 'incompatible' | null

export type Requirement = {
  supplyId: string
  recipeQuantity: number
  recipeUnit: Unit
  quantity: number
  supply: Supply | null
  available: number
  shortage: number
  problem: RequirementProblem
}

export function calculateRequirements(
  recipe: Recipe,
  quantity: number,
  supplies: Supply[],
): Requirement[] {
  if (!Number.isFinite(quantity) || quantity <= 0) return []
  if (!Number.isFinite(recipe.outputQuantity) || recipe.outputQuantity <= 0) {
    return []
  }

  const scale = quantity / recipe.outputQuantity

  return recipe.ingredients.map((ingredient) => {
    const supply =
      supplies.find((item) => item.id === ingredient.supplyId) ?? null
    const recipeUnit = ingredient.unit ?? supply?.unit ?? 'unidad'
    const scaled = roundQuantity(ingredient.quantity * scale)

    if (!supply) {
      return {
        supplyId: ingredient.supplyId,
        recipeQuantity: scaled,
        recipeUnit,
        quantity: scaled,
        supply: null,
        available: 0,
        shortage: scaled,
        problem: 'missing' as const,
      }
    }

    const converted = convert(scaled, recipeUnit, supply.unit)
    if (converted === null) {
      return {
        supplyId: ingredient.supplyId,
        recipeQuantity: scaled,
        recipeUnit,
        quantity: scaled,
        supply,
        available: supply.quantity,
        shortage: 0,
        problem: 'incompatible' as const,
      }
    }

    const required = roundQuantity(converted)

    return {
      supplyId: ingredient.supplyId,
      recipeQuantity: scaled,
      recipeUnit,
      quantity: required,
      supply,
      available: supply.quantity,
      shortage: roundQuantity(Math.max(0, required - supply.quantity)),
      problem: null,
    }
  })
}

export function hasShortage(requirements: Requirement[]): boolean {
  return requirements.some((requirement) => requirement.shortage > 0)
}

export function hasProblems(requirements: Requirement[]): boolean {
  return requirements.some((requirement) => requirement.problem !== null)
}

export function requirementsCost(requirements: Requirement[]): number | null {
  let total = 0
  for (const requirement of requirements) {
    if (!requirement.supply || requirement.problem !== null) return null
    total += requirement.quantity * requirement.supply.unitCost
  }
  return total
}

export function toConsumedIngredients(
  requirements: Requirement[],
): ConsumedIngredient[] | null {
  const consumed: ConsumedIngredient[] = []
  for (const requirement of requirements) {
    if (!requirement.supply || requirement.problem !== null) return null
    consumed.push({
      supplyId: requirement.supplyId,
      supplyName: requirement.supply.name,
      quantity: requirement.quantity,
      unit: requirement.supply.unit,
      unitCost: requirement.supply.unitCost,
    })
  }
  return consumed
}

export type ProductionCapacity = {
  maxUnits: number
  limitingSupply: Supply | null
}

export function productionCapacity(
  recipe: Recipe,
  supplies: Supply[],
): ProductionCapacity | null {
  if (!Number.isFinite(recipe.outputQuantity) || recipe.outputQuantity <= 0) {
    return null
  }

  let minRatio = Number.POSITIVE_INFINITY
  let limitingSupply: Supply | null = null

  for (const ingredient of recipe.ingredients) {
    const supply =
      supplies.find((item) => item.id === ingredient.supplyId) ?? null
    if (!supply) return null

    const perBatch = convert(
      ingredient.quantity,
      ingredient.unit ?? supply.unit,
      supply.unit,
    )
    if (perBatch === null || perBatch <= 0) return null

    const ratio = supply.quantity / perBatch
    if (ratio < minRatio) {
      minRatio = ratio
      limitingSupply = supply
    }
  }

  if (!Number.isFinite(minRatio)) return null

  return {
    maxUnits: Math.max(
      0,
      Math.floor(minRatio * recipe.outputQuantity + 1e-9),
    ),
    limitingSupply,
  }
}
