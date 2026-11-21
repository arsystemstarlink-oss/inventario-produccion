import { beforeEach, describe, expect, it } from 'vitest'
import {
  EXCHANGE_RATE_STORAGE_KEY,
  isRateFresh,
  loadCachedRate,
  parseOfficialRate,
  saveCachedRate,
} from './rate'

beforeEach(() => {
  window.localStorage.clear()
})

describe('parseOfficialRate', () => {
  it('reads the promedio from the official API response', () => {
    expect(
      parseOfficialRate({
        moneda: 'USD',
        fuente: 'oficial',
        nombre: 'Dólar',
        compra: null,
        venta: null,
        promedio: 918.7662,
        fechaActualizacion: '2026-11-20T00:00:00-04:00',
      }),
    ).toEqual({
      rate: 918.7662,
      updatedAt: '2026-11-20T00:00:00-04:00',
    })
  })

  it('falls back to the average of compra and venta', () => {
    expect(
      parseOfficialRate({
        compra: 900,
        venta: 940,
        promedio: null,
        fechaActualizacion: '2026-11-20T00:00:00-04:00',
      }),
    ).toEqual({
      rate: 920,
      updatedAt: '2026-11-20T00:00:00-04:00',
    })
  })

  it('rejects responses without a usable rate', () => {
    expect(parseOfficialRate(null)).toBeNull()
    expect(parseOfficialRate({ promedio: 0 })).toBeNull()
    expect(parseOfficialRate({ compra: 900 })).toBeNull()
  })
})

describe('rate cache', () => {
  it('saves and loads the last official rate', () => {
    const info = {
      rate: 918.7662,
      updatedAt: '2026-11-20T00:00:00-04:00',
      fetchedAt: Date.now(),
    }

    saveCachedRate(info)

    expect(loadCachedRate()).toEqual(info)
    expect(
      JSON.parse(
        window.localStorage.getItem(EXCHANGE_RATE_STORAGE_KEY) ?? 'null',
      ),
    ).toEqual(info)
  })

  it('ignores invalid cached data', () => {
    window.localStorage.setItem(EXCHANGE_RATE_STORAGE_KEY, '{"rate":0}')
    expect(loadCachedRate()).toBeNull()
  })

  it('detects whether the cached rate is still fresh', () => {
    const info = {
      rate: 918.7662,
      updatedAt: '2026-11-20T00:00:00-04:00',
      fetchedAt: Date.now(),
    }
    expect(isRateFresh(info)).toBe(true)
    expect(isRateFresh({ ...info, fetchedAt: Date.now() - 2 * 60 * 60 * 1000 })).toBe(
      false,
    )
  })
})
