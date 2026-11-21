import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BackupData } from './backup'
import { applyBackup, parseBackup, suppliesToCsv } from './backup'
import {
  PRODUCTION_STORAGE_KEY,
  RECIPES_STORAGE_KEY,
  SUPPLIES_STORAGE_KEY,
  loadProduction,
  loadRecipes,
  loadSupplies,
} from './localStorage'

const backup: BackupData = {
  app: 'inventario-produccion',
  version: 1,
  exportedAt: '2026-01-01T00:00:00.000Z',
  supplies: [
    {
      id: 'harina',
      name: 'Harina 000',
      quantity: 2,
      unit: 'kg',
      unitCost: 1.5,
      minStock: 0.5,
      packageSize: 0.5,
      packageCost: 1.5,
    },
  ],
  recipes: [
    {
      id: 'pan',
      name: 'Pan',
      outputQuantity: 20,
      ingredients: [{ supplyId: 'harina', quantity: 500, unit: 'g' }],
    },
  ],
  production: [
    {
      id: 'p1',
      recipeId: 'pan',
      recipeName: 'Pan',
      quantity: 20,
      producedAt: '2026-01-01T10:00:00.000Z',
      consumed: [
        {
          supplyId: 'harina',
          supplyName: 'Harina 000',
          quantity: 0.5,
          unit: 'kg',
          unitCost: 1.5,
        },
      ],
    },
  ],
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('backup', () => {
  it('parses a valid backup file', () => {
    const result = parseBackup(JSON.stringify(backup))

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.supplies).toHaveLength(1)
      expect(result.data.recipes).toHaveLength(1)
      expect(result.data.production).toHaveLength(1)
    }
  })

  it('rejects broken JSON and incomplete backups', () => {
    expect(parseBackup('{nope').ok).toBe(false)

    const incomplete = parseBackup(
      JSON.stringify({ supplies: [{ id: 'x' }], recipes: [], production: [] }),
    )
    expect(incomplete.ok).toBe(false)
    if (!incomplete.ok) expect(incomplete.error).toContain('dañados')
  })

  it('applies a backup to local storage', () => {
    expect(applyBackup(backup)).toEqual({ ok: true })

    expect(loadSupplies().data).toHaveLength(1)
    expect(loadRecipes().data[0].name).toBe('Pan')
    expect(loadProduction().data[0].recipeName).toBe('Pan')
  })

  it('restores previous values when saving fails', () => {
    window.localStorage.setItem(SUPPLIES_STORAGE_KEY, '[]')
    const original = Storage.prototype.setItem
    let failed = false
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (!failed && key === RECIPES_STORAGE_KEY) {
        failed = true
        throw new Error('QuotaExceededError')
      }
      original.call(this, key, value)
    })

    const result = applyBackup(backup)

    expect(result.ok).toBe(false)
    expect(window.localStorage.getItem(SUPPLIES_STORAGE_KEY)).toBe('[]')
    expect(window.localStorage.getItem(PRODUCTION_STORAGE_KEY)).toBeNull()
  })

  it('exports supplies as csv rows', () => {
    const csv = suppliesToCsv(backup.supplies)
    const [header, row] = csv.split('\r\n')

    expect(header).toContain('Insumo,Unidad')
    expect(row).toContain('Harina 000,kg,2,4')
  })
})
