export type Unit = 'kg' | 'g' | 'l' | 'ml' | 'unidad'

export type Supply = {
  id: string
  name: string
  quantity: number
  unit: Unit
  unitCost: number
  minStock: number
  packageSize: number
  packageCost: number
}

export type RecipeIngredient = {
  supplyId: string
  quantity: number
  unit?: Unit
}

export type Recipe = {
  id: string
  name: string
  outputQuantity: number
  ingredients: RecipeIngredient[]
}

export type ConsumedIngredient = {
  supplyId: string
  supplyName: string
  quantity: number
  unit: Unit
  unitCost: number
}

export type ProductionRecord = {
  id: string
  recipeId: string
  recipeName: string
  quantity: number
  producedAt: string
  consumed: ConsumedIngredient[]
}

export type SupplyDraft = Omit<Supply, 'id'>
export type RecipeDraft = Omit<Recipe, 'id'>
export type ProductionDraft = Omit<ProductionRecord, 'id'>

export type SupplyFormValues = {
  name: string
  packageSize: string
  unit: Unit
  packages: string
  packageCost: string
  minPackages: string
}

export type RecipeIngredientValues = {
  supplyId: string
  quantity: string
  unit: Unit
}

export type RecipeFormValues = {
  name: string
  outputQuantity: string
  ingredients: RecipeIngredientValues[]
}

export type ProductionFormValues = {
  recipeId: string
  quantity: string
}
