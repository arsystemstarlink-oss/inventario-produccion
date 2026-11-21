import type { ProductionRecord, Recipe, Supply } from '../types'
import {
  PRODUCTION_STORAGE_KEY,
  RECIPES_STORAGE_KEY,
  SUPPLIES_STORAGE_KEY,
  isProductionRecord,
  isRecipe,
  isSupply,
  loadProduction,
  loadRecipes,
  loadSupplies,
  normalizeSupply,
} from './localStorage'

export type BackupData = {
  app: 'inventario-produccion'
  version: 1
  exportedAt: string
  supplies: Supply[]
  recipes: Recipe[]
  production: ProductionRecord[]
}

export type BackupParseResult =
  | { ok: true; data: BackupData }
  | { ok: false; error: string }

export function buildBackup(): BackupData {
  return {
    app: 'inventario-produccion',
    version: 1,
    exportedAt: new Date().toISOString(),
    supplies: loadSupplies().data.map(normalizeSupply),
    recipes: loadRecipes().data,
    production: loadProduction().data,
  }
}

export function parseBackup(raw: string): BackupParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'El archivo no es un respaldo válido (JSON dañado).' }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'El archivo no tiene el formato de respaldo esperado.' }
  }

  const candidate = parsed as Record<string, unknown>
  if (
    !Array.isArray(candidate.supplies) ||
    !candidate.supplies.every(isSupply) ||
    !Array.isArray(candidate.recipes) ||
    !candidate.recipes.every(isRecipe) ||
    !Array.isArray(candidate.production) ||
    !candidate.production.every(isProductionRecord)
  ) {
    return {
      ok: false,
      error:
        'El respaldo está incompleto o tiene datos dañados. No se cambió nada.',
    }
  }

  return {
    ok: true,
    data: {
      app: 'inventario-produccion',
      version: 1,
      exportedAt:
        typeof candidate.exportedAt === 'string'
          ? candidate.exportedAt
          : new Date().toISOString(),
      supplies: candidate.supplies.map(normalizeSupply),
      recipes: candidate.recipes,
      production: candidate.production,
    },
  }
}

export type ApplyResult = { ok: true } | { ok: false; error: string }

export function applyBackup(data: BackupData): ApplyResult {
  let storage: Storage
  try {
    storage = window.localStorage
  } catch {
    return {
      ok: false,
      error: 'No se pudo acceder al almacenamiento local del navegador.',
    }
  }

  const entries: [string, string][] = [
    [SUPPLIES_STORAGE_KEY, JSON.stringify(data.supplies)],
    [RECIPES_STORAGE_KEY, JSON.stringify(data.recipes)],
    [PRODUCTION_STORAGE_KEY, JSON.stringify(data.production)],
  ]
  const previous = entries.map(
    ([key]) => [key, storage.getItem(key)] as [string, string | null],
  )

  try {
    for (const [key, value] of entries) storage.setItem(key, value)
    return { ok: true }
  } catch {
    for (const [key, value] of previous) {
      try {
        if (value === null) storage.removeItem(key)
        else storage.setItem(key, value)
      } catch {
        // Ignorar: el error original ya se informa abajo.
      }
    }
    return {
      ok: false,
      error:
        'No se pudo guardar el respaldo. Revisa el espacio disponible del navegador.',
    }
  }
}

function todayStamp(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function downloadBackup(backup: BackupData = buildBackup()): void {
  downloadFile(
    `inventario-produccion-${todayStamp()}.json`,
    JSON.stringify(backup, null, 2),
    'application/json',
  )
}

function csvCell(value: string | number): string {
  const text = String(value)
  if (/[",\n;]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function suppliesToCsv(supplies: Supply[]): string {
  const header = [
    'Insumo',
    'Unidad',
    'Cantidad total',
    'Paquetes',
    'Contenido por paquete',
    'Costo por paquete (USD)',
    'Valor total (USD)',
    'Paquetes de aviso',
  ]
  const rows = supplies.map((supply) => [
    supply.name,
    supply.unit,
    supply.quantity,
    supply.packageSize > 0 ? supply.quantity / supply.packageSize : 0,
    supply.packageSize,
    supply.packageCost,
    supply.quantity * supply.unitCost,
    supply.packageSize > 0 ? supply.minStock / supply.packageSize : 0,
  ])
  return [header, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n')
}

export function downloadSuppliesCsv(
  supplies: Supply[] = buildBackup().supplies,
): void {
  downloadFile(
    `inventario-${todayStamp()}.csv`,
    `\uFEFF${suppliesToCsv(supplies)}`,
    'text/csv;charset=utf-8',
  )
}

function downloadFile(name: string, content: string, type: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
