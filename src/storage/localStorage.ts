import type {
  ConsumedIngredient,
  ProductionRecord,
  Recipe,
  RecipeIngredient,
  Supply,
  Unit,
} from '../types'
import { UNITS } from '../lib/units'

export const SUPPLIES_STORAGE_KEY = 'inventory:supplies:v1'
export const LEGACY_PRODUCTS_STORAGE_KEY = 'inventory:products:v1'
export const RECIPES_STORAGE_KEY = 'production:recipes:v1'
export const PRODUCTION_STORAGE_KEY = 'production:history:v1'

export type LoadResult<T> = {
  data: T[]
  error: string | null
}

export type SaveResult = { ok: true } | { ok: false; error: string }

function getStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isUnit(value: unknown): value is Unit {
  return typeof value === 'string' && UNITS.includes(value as Unit)
}

function isSupply(value: unknown): value is Supply {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isNonNegativeNumber(value.quantity) &&
    isUnit(value.unit) &&
    isNonNegativeNumber(value.unitCost) &&
    (value.minStock === undefined || isNonNegativeNumber(value.minStock)) &&
    (value.packageSize === undefined || isPositiveNumber(value.packageSize)) &&
    (value.packageCost === undefined || isNonNegativeNumber(value.packageCost))
  )
}

function isRecipeIngredient(value: unknown): value is RecipeIngredient {
  return (
    isObject(value) &&
    isNonEmptyString(value.supplyId) &&
    isPositiveNumber(value.quantity) &&
    (value.unit === undefined || isUnit(value.unit))
  )
}

function isRecipe(value: unknown): value is Recipe {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isPositiveNumber(value.outputQuantity) &&
    Array.isArray(value.ingredients) &&
    value.ingredients.length > 0 &&
    value.ingredients.every(isRecipeIngredient)
  )
}

function isConsumedIngredient(value: unknown): value is ConsumedIngredient {
  return (
    isObject(value) &&
    isNonEmptyString(value.supplyId) &&
    isNonEmptyString(value.supplyName) &&
    isPositiveNumber(value.quantity) &&
    isUnit(value.unit) &&
    isNonNegativeNumber(value.unitCost)
  )
}

function isProductionRecord(value: unknown): value is ProductionRecord {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.recipeId) &&
    isNonEmptyString(value.recipeName) &&
    isPositiveNumber(value.quantity) &&
    isNonEmptyString(value.producedAt) &&
    Array.isArray(value.consumed) &&
    value.consumed.length > 0 &&
    value.consumed.every(isConsumedIngredient)
  )
}

type LegacyProduct = {
  id: string
  name: string
  quantity: number
  value: number
}

function isLegacyProduct(value: unknown): value is LegacyProduct {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isNonNegativeNumber(value.quantity) &&
    Number.isInteger(value.quantity) &&
    isNonNegativeNumber(value.value)
  )
}

function backupCorruptData(storage: Storage, key: string, raw: string): boolean {
  try {
    storage.setItem(`${key}:corrupt`, raw)
    return true
  } catch {
    return false
  }
}

function parseList<T>(
  storage: Storage,
  key: string,
  label: string,
  raw: string,
  isItem: (value: unknown) => value is T,
): LoadResult<T> {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.every(isItem)) {
      throw new Error('invalid data')
    }
    return { data: parsed, error: null }
  } catch {
    const backedUp = backupCorruptData(storage, key, raw)
    const suffix = backedUp
      ? ' Se guardó una copia de respaldo de los datos originales.'
      : ''
    return {
      data: [],
      error: `Los datos guardados de ${label} estaban dañados y se ignoraron.${suffix}`,
    }
  }
}

function readRaw(
  storage: Storage,
  key: string,
): { raw: string | null; error: string | null } {
  try {
    return { raw: storage.getItem(key), error: null }
  } catch {
    return {
      raw: null,
      error: 'No se pudo leer el almacenamiento local del navegador.',
    }
  }
}

function noStorage(): LoadResult<never> {
  return {
    data: [],
    error: 'No se pudo acceder al almacenamiento local del navegador.',
  }
}

function normalizeSupply(supply: Supply): Supply {
  const minStock = (supply as { minStock?: unknown }).minStock
  const packageSize = (supply as { packageSize?: unknown }).packageSize
  const packageCost = (supply as { packageCost?: unknown }).packageCost
  return {
    ...supply,
    minStock: isNonNegativeNumber(minStock) ? minStock : 0,
    packageSize: isPositiveNumber(packageSize) ? packageSize : 1,
    packageCost: isNonNegativeNumber(packageCost)
      ? packageCost
      : supply.unitCost,
  }
}

export function loadSupplies(): LoadResult<Supply> {
  const storage = getStorage()
  if (!storage) return noStorage()

  const current = readRaw(storage, SUPPLIES_STORAGE_KEY)
  if (current.error) return { data: [], error: current.error }
  if (current.raw !== null) {
    const result = parseList(
      storage,
      SUPPLIES_STORAGE_KEY,
      'inventario',
      current.raw,
      isSupply,
    )
    return { data: result.data.map(normalizeSupply), error: result.error }
  }

  const legacy = readRaw(storage, LEGACY_PRODUCTS_STORAGE_KEY)
  if (legacy.error) return { data: [], error: legacy.error }
  if (legacy.raw === null) return { data: [], error: null }

  try {
    const parsed: unknown = JSON.parse(legacy.raw)
    if (!Array.isArray(parsed) || !parsed.every(isLegacyProduct)) {
      throw new Error('invalid legacy data')
    }
    return {
      data: parsed.map((product) => ({
        id: product.id,
        name: product.name,
        quantity: product.quantity,
        unit: 'unidad' as const,
        unitCost: product.value,
        minStock: 0,
        packageSize: 1,
        packageCost: product.value,
      })),
      error: null,
    }
  } catch {
    const backedUp = backupCorruptData(
      storage,
      LEGACY_PRODUCTS_STORAGE_KEY,
      legacy.raw,
    )
    const suffix = backedUp
      ? ' Se guardó una copia de respaldo de los datos originales.'
      : ''
    return {
      data: [],
      error: `Los datos guardados de inventario estaban dañados y se ignoraron.${suffix}`,
    }
  }
}

export function saveSupplies(supplies: Supply[]): SaveResult {
  return saveList(SUPPLIES_STORAGE_KEY, supplies)
}

export function loadRecipes(): LoadResult<Recipe> {
  const storage = getStorage()
  if (!storage) return noStorage()

  const current = readRaw(storage, RECIPES_STORAGE_KEY)
  if (current.error) return { data: [], error: current.error }
  if (current.raw === null) return { data: [], error: null }

  return parseList(storage, RECIPES_STORAGE_KEY, 'recetas', current.raw, isRecipe)
}

export function saveRecipes(recipes: Recipe[]): SaveResult {
  return saveList(RECIPES_STORAGE_KEY, recipes)
}

export function loadProduction(): LoadResult<ProductionRecord> {
  const storage = getStorage()
  if (!storage) return noStorage()

  const current = readRaw(storage, PRODUCTION_STORAGE_KEY)
  if (current.error) return { data: [], error: current.error }
  if (current.raw === null) return { data: [], error: null }

  return parseList(
    storage,
    PRODUCTION_STORAGE_KEY,
    'producción',
    current.raw,
    isProductionRecord,
  )
}

export function saveProduction(records: ProductionRecord[]): SaveResult {
  return saveList(PRODUCTION_STORAGE_KEY, records)
}

function saveList<T>(key: string, items: T[]): SaveResult {
  const storage = getStorage()
  if (!storage) {
    return {
      ok: false,
      error: 'No se pudo acceder al almacenamiento local del navegador.',
    }
  }

  try {
    storage.setItem(key, JSON.stringify(items))
    return { ok: true }
  } catch {
    return {
      ok: false,
      error:
        'No se pudieron guardar los datos. Revisa el espacio disponible del navegador e inténtalo de nuevo.',
    }
  }
}
