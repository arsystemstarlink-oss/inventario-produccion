import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        moneda: 'USD',
        fuente: 'oficial',
        nombre: 'Dólar',
        compra: null,
        venta: null,
        promedio: 918.7662,
        fechaActualizacion: '2026-11-20T00:00:00-04:00',
      }),
    })),
  )
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.unstubAllGlobals()
})
